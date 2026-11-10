const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, initDatabase } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ==========================================
// 1. PRODUCTS ENDPOINTS
// ==========================================
app.get('/api/products', async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products ORDER BY id ASC');
        res.json({ success: true, data: products });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 2. ORDER / BILLING ENDPOINTS
// ==========================================
// Create a new order (save bill to MySQL)
app.post('/api/orders', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { name, phone, discountPercent, paymentStatus, items } = req.body;

        if (!name || !phone || !items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Customer name, phone, and items are required.' });
        }

        // Calculate totals
        let subtotal = 0;
        const processedItems = items.map(item => {
            const qty = parseInt(item.quantity, 10) || 1;
            const price = parseFloat(item.price) || 0;
            const itemTotal = price * qty;
            subtotal += itemTotal;
            return {
                productId: item.id || 'GEN',
                name: item.name,
                price: price,
                quantity: qty,
                itemTotal: itemTotal
            };
        });

        const discPercent = Math.min(Math.max(parseFloat(discountPercent) || 0, 0), 100);
        const discountAmount = Math.round((subtotal * discPercent) / 100 * 100) / 100;
        const grandTotal = subtotal - discountAmount;
        const validStatus = (paymentStatus === 'NOT PAID') ? 'NOT PAID' : 'PAID';
        const orderCode = 'ZENZY-' + Math.floor(10000 + Math.random() * 90000);

        await connection.beginTransaction();

        const [orderResult] = await connection.query(
            `INSERT INTO orders (order_code, customer_name, customer_phone, subtotal, discount_percent, discount_amount, total_amount, payment_status, order_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [orderCode, name.trim(), phone.trim(), subtotal, discPercent, discountAmount, grandTotal, validStatus]
        );

        const orderId = orderResult.insertId;

        for (const item of processedItems) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, item_total)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, item.productId, item.name, item.price, item.quantity, item.itemTotal]
            );
        }

        await connection.commit();

        const [createdOrder] = await connection.query(
            'SELECT * FROM orders WHERE id = ?',
            [orderId]
        );

        res.json({
            success: true,
            order: {
                ...createdOrder[0],
                items: processedItems
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('Error creating order:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        connection.release();
    }
});

// Update payment status (e.g. mark Paid / Not Paid)
app.patch('/api/orders/:id/payment', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { paymentStatus } = req.body;

        let newStatus = paymentStatus;
        if (!newStatus) {
            // Toggle existing status
            const [existing] = await pool.query('SELECT payment_status FROM orders WHERE id = ?', [orderId]);
            if (existing.length === 0) return res.status(404).json({ success: false, error: 'Order not found' });
            newStatus = existing[0].payment_status === 'PAID' ? 'NOT PAID' : 'PAID';
        }

        await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', [newStatus, orderId]);
        res.json({ success: true, newStatus: newStatus });
    } catch (err) {
        console.error('Error updating payment status:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Fetch single order details with items for editing
app.get('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const [orders] = await pool.query(
            `SELECT id, order_code, customer_name, customer_phone, subtotal, discount_percent, 
                    discount_amount, total_amount, payment_status, 
                    DATE_FORMAT(order_date, '%Y-%m-%d %H:%i:%s') AS order_date,
                    DATE_FORMAT(order_date, '%Y-%m-%dT%H:%i') AS datetime_local
             FROM orders WHERE id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const [items] = await pool.query(
            `SELECT id, product_id, product_name, unit_price, quantity, item_total
             FROM order_items WHERE order_id = ?`,
            [orderId]
        );

        res.json({
            success: true,
            order: {
                ...orders[0],
                items
            }
        });
    } catch (err) {
        console.error('Error fetching order for edit:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update an entire order entry (items, quantity, discount, final price, date, customer info)
app.put('/api/orders/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const orderId = req.params.id;
        const {
            customer_name,
            customer_phone,
            order_date,
            payment_status,
            discount_percent,
            discount_amount,
            total_amount,
            items
        } = req.body;

        if (!customer_name || !customer_phone || !items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Customer name, phone, and at least one item are required.' });
        }

        // Verify order exists
        const [existing] = await connection.query('SELECT id FROM orders WHERE id = ?', [orderId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found.' });
        }

        // Calculate subtotal from items
        let subtotal = 0;
        const processedItems = items.map(item => {
            const qty = parseInt(item.quantity, 10) || 1;
            const price = parseFloat(item.unit_price !== undefined ? item.unit_price : item.price) || 0;
            const itemTotal = Math.round(price * qty * 100) / 100;
            subtotal += itemTotal;
            return {
                product_id: item.product_id || item.id || 'GEN',
                product_name: item.product_name || item.name || 'Clothing Item',
                unit_price: price,
                quantity: qty,
                item_total: itemTotal
            };
        });

        const discPercent = parseFloat(discount_percent) || 0;
        const calculatedDiscount = Math.round((subtotal * discPercent) / 100 * 100) / 100;
        const discAmount = (discount_amount !== undefined && discount_amount !== null && !isNaN(parseFloat(discount_amount)))
            ? parseFloat(discount_amount)
            : calculatedDiscount;

        // Final price: allows manual override if specified, otherwise subtotal - discount
        let grandTotal = (total_amount !== undefined && total_amount !== null && !isNaN(parseFloat(total_amount)))
            ? parseFloat(total_amount)
            : (subtotal - discAmount);
        if (grandTotal < 0) grandTotal = 0;

        const validStatus = (payment_status === 'NOT PAID') ? 'NOT PAID' : 'PAID';

        await connection.beginTransaction();

        // Update orders table
        if (order_date) {
            const formattedDate = order_date.replace('T', ' ');
            await connection.query(
                `UPDATE orders 
                 SET customer_name = ?, customer_phone = ?, subtotal = ?, discount_percent = ?, 
                     discount_amount = ?, total_amount = ?, payment_status = ?, order_date = ?
                 WHERE id = ?`,
                [customer_name.trim(), customer_phone.trim(), subtotal, discPercent, discAmount, grandTotal, validStatus, formattedDate, orderId]
            );
        } else {
            await connection.query(
                `UPDATE orders 
                 SET customer_name = ?, customer_phone = ?, subtotal = ?, discount_percent = ?, 
                     discount_amount = ?, total_amount = ?, payment_status = ?
                 WHERE id = ?`,
                [customer_name.trim(), customer_phone.trim(), subtotal, discPercent, discAmount, grandTotal, validStatus, orderId]
            );
        }

        // Replace line items
        await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);

        for (const item of processedItems) {
            await connection.query(
                `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, item_total)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, item.product_id, item.product_name, item.unit_price, item.quantity, item.item_total]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Order updated successfully',
            orderId: orderId
        });
    } catch (err) {
        await connection.rollback();
        console.error('Error updating order:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        connection.release();
    }
});

// ==========================================
// 3. SALES & ANALYTICS REPORT ENDPOINT
// ==========================================
app.get('/api/reports/sales', async (req, res) => {
    try {
        const { month, productId, paymentStatus } = req.query;

        // 1. Get available months from database
        const [monthRows] = await pool.query(
            `SELECT DISTINCT DATE_FORMAT(order_date, '%Y-%m') AS ym
             FROM orders
             ORDER BY ym DESC`
        );
        const availableMonths = monthRows.map(r => r.ym);

        // Determine target month (default to latest or specified)
        const targetMonth = month || (availableMonths.length > 0 ? availableMonths[0] : null);

        // Build base condition
        let whereClauses = [];
        let params = [];

        if (targetMonth && targetMonth !== 'all') {
            whereClauses.push("DATE_FORMAT(o.order_date, '%Y-%m') = ?");
            params.push(targetMonth);
        }

        if (paymentStatus && paymentStatus !== 'ALL') {
            whereClauses.push("o.payment_status = ?");
            params.push(paymentStatus);
        }

        if (productId && productId !== 'all') {
            whereClauses.push("oi.product_id = ?");
            params.push(productId);
        }

        const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Query filtered orders
        const ordersQuery = `
            SELECT 
                o.id,
                o.order_code,
                o.customer_name,
                o.customer_phone,
                o.subtotal,
                o.discount_percent,
                o.discount_amount,
                o.total_amount,
                o.payment_status,
                DATE_FORMAT(o.order_date, '%Y-%m-%d %H:%i:%s') AS order_date,
                DATE_FORMAT(o.order_date, '%Y-%m-%d') AS date_only,
                COALESCE(GROUP_CONCAT(CONCAT(oi.product_name, ' (x', oi.quantity, ')') SEPARATOR ', '), 'N/A') AS items_summary,
                COALESCE(SUM(oi.quantity), 0) AS total_units_in_order
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            ${whereSQL}
            GROUP BY o.id
            ORDER BY o.order_date DESC
        `;
        const [orders] = await pool.query(ordersQuery, params);

        // Daily breakdown for selected month
        const dailyQuery = `
            SELECT 
                DATE_FORMAT(o.order_date, '%Y-%m-%d') AS date,
                DAYNAME(o.order_date) AS day_of_week,
                COUNT(DISTINCT o.id) AS order_count,
                COALESCE(SUM(oi.quantity), 0) AS units_sold,
                COALESCE(SUM(oi.item_total), 0) AS product_sales_total,
                COALESCE(SUM(DISTINCT o.total_amount), 0) AS order_sales_total
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            ${whereSQL}
            GROUP BY DATE_FORMAT(o.order_date, '%Y-%m-%d'), DAYNAME(o.order_date)
            ORDER BY date ASC
        `;
        const [dailySales] = await pool.query(dailyQuery, params);

        // Overall summary stats
        let totalRevenue = 0;
        let totalUnits = 0;
        let paidAmount = 0;
        let unpaidAmount = 0;

        orders.forEach(ord => {
            const amt = parseFloat(ord.total_amount) || 0;
            totalRevenue += amt;
            totalUnits += parseInt(ord.total_units_in_order, 10) || 0;
            if (ord.payment_status === 'PAID') {
                paidAmount += amt;
            } else {
                unpaidAmount += amt;
            }
        });

        res.json({
            success: true,
            selectedMonth: targetMonth,
            availableMonths,
            summary: {
                totalOrders: orders.length,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalUnits: totalUnits,
                paidAmount: Math.round(paidAmount * 100) / 100,
                unpaidAmount: Math.round(unpaidAmount * 100) / 100
            },
            dailySales,
            orders
        });
    } catch (err) {
        console.error('Error generating report:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start server
app.listen(PORT, async () => {
    await initDatabase();
    console.log(`=======================================================`);
    console.log(` Zenzy Clothing Wear POS & Database Server Running`);
    console.log(` Web URL: http://localhost:${PORT}`);
    console.log(` Database: MySQL/MariaDB on port ${process.env.DB_PORT || 3306}`);
    console.log(`=======================================================`);
});
