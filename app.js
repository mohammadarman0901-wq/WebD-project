// ==========================================
// 1. INVENTORY & STATE
// ==========================================
let inventory = [
    { id: 'Z01', name: "Zenzy Graphic T-Shirt", price: 599, image: "https://assets.myntassets.com/w_412,q_50,,dpr_3,fl_progressive,f_webp/assets/images/22194038/2024/9/28/7159f452-c0b6-4cf6-98f7-f0bcff82f3021727530844469-VEIRDO-Graphic-Printed-Oversized-Fit-Cotton-T-shirt-42172753-1.jpg" },
    { id: 'Z02', name: "Classic Polo Shirt", price: 899, image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&q=80" },
    { id: 'Z03', name: "Slim Fit Denim Jeans", price: 1299, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80" },
    { id: 'Z04', name: "Cotton Chinos", price: 1150, image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80" },
    { id: 'Z05', name: "Winter Hoodie", price: 1499, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80" },
    { id: 'Z06', name: "Formal White Shirt", price: 999, image: "https://www.myntra.com/shirts/hancock/hancock-men-white-slim-fit-solid-formal-shirt/11103910/buy" },
    { id: 'Z07', name: "Classic Black Crew Neck T-Shirt", price: 499, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80" },
    { id: 'Z08', name: "Blue Linen Casual Shirt", price: 1199, image: "https://images.unsplash.com/photo-1740711152088-88a009e877bb?w=500&q=80" },
    { id: 'Z09', name: "Plain White T-Shirt", price: 399, image: "https://images.unsplash.com/photo-1778671394516-8270eac13c42?w=500&q=80" },
    { id: 'Z10', name: "Casual Everyday Wear", price: 799, image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80" },
    { id: 'Z11', name: "White Full Sleeve Sweatshirt", price: 1099, image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80" },
    { id: 'Z12', name: "Classic Blue Jeans", price: 1399, image: "https://images.unsplash.com/photo-1714143136372-ddaf8b606da7?w=500&q=80" },
    { id: 'Z13', name: "Pink Cargo Joggers", price: 1299, image: "https://images.unsplash.com/photo-1789110520495-8f1b8545c0ff?w=500&q=80" }
];

let cart = [];
let monthsLoaded = false;
let productsDropdownLoaded = false;

// Fetch live products from MySQL database
async function fetchProductsFromDB() {
    try {
        const response = await fetch('/api/products');
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
            inventory = result.data.map(p => ({
                id: p.id,
                name: p.name,
                price: parseFloat(p.price),
                image: p.image
            }));
        }
    } catch (err) {
        console.warn('Could not fetch products from MySQL API, using local fallback:', err);
    }
}

// ==========================================
// 2. PAGE NAVIGATION LOGIC
// ==========================================
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active-page'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active-page');
    
    const navBtn = document.getElementById(`nav-${pageId}`);
    if (navBtn) navBtn.classList.add('active');

    if (pageId === 'products-page') renderProducts('full-catalog-grid', false);
    if (pageId === 'order-page') renderProducts('order-catalog-grid', true);
    if (pageId === 'database-page') loadDatabaseAnalytics();
}

// ==========================================
// 3. PRODUCTS CATALOG RENDERER
// ==========================================
function renderProducts(containerId, isClickable) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = inventory.map(product => `
        <div class="product-card" ${isClickable ? `onclick='addToCart("${product.id}")'` : ''}>
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h4>${product.name}</h4>
            <span class="price">₹${product.price.toFixed(2)}</span>
            ${isClickable ? '<p style="font-size:0.85rem; color:#10b981; margin-top:8px; font-weight:bold;">+ Click to Add to Bill</p>' : ''}
        </div>
    `).join('');
}

// ==========================================
// 4. CART & BILLING LOGIC
// ==========================================
function addToCart(productId) {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
    }
    updateCartUI();
}

function getDiscountPercent() {
    const value = parseFloat(document.getElementById('discount-given').value);
    return (isNaN(value) || value < 0) ? 0 : value;
}

function calculateDiscountAmount(subtotal, percent) {
    return Math.round(subtotal * percent) / 100;
}

function updateCartUI() {
    const cartContainer = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('subtotal-amount');
    const discountEl = document.getElementById('discount-amount');
    const grandTotalEl = document.getElementById('grand-total');
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">No clothes added to the order.</div>';
        subtotalEl.textContent = '₹0.00';
        discountEl.textContent = '- ₹0.00 (0%)';
        grandTotalEl.textContent = '₹0.00';
        return;
    }

    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <strong>${item.name}</strong><br>
                <span style="font-size:0.9rem; color:#64748b;">₹${item.price.toFixed(2)} each</span>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                <span style="font-weight:bold; width:22px; text-align:center;">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                <strong style="margin-left:12px; color:var(--primary);">₹${(item.price * item.quantity).toFixed(2)}</strong>
            </div>
        </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const percent = Math.min(getDiscountPercent(), 100);
    const discount = calculateDiscountAmount(subtotal, percent);
    const total = subtotal - discount;

    subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    discountEl.textContent = `- ₹${discount.toFixed(2)} (${percent}%)`;
    grandTotalEl.textContent = `₹${total.toFixed(2)}`;
}

// Generate bill and save directly to MySQL database
async function generateBill() {
    const customerName = document.getElementById('customer-name').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const paymentStatus = document.getElementById('payment-status-select').value;
    const discountPercent = getDiscountPercent();
    const btn = document.getElementById('generate-bill-btn');
    
    if (!customerName || !customerPhone) {
        return alert("Please enter Customer Name and Mobile Number.");
    }
    if (cart.length === 0) {
        return alert("Please add at least one item to the cart before generating a bill.");
    }
    if (discountPercent > 100) {
        return alert("Discount cannot be more than 100%.");
    }

    btn.disabled = true;
    btn.textContent = "Generating...";

    const payload = {
        name: customerName,
        phone: customerPhone,
        discountPercent: discountPercent,
        paymentStatus: paymentStatus,
        items: cart.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity
        }))
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to save order');
        }

        const savedOrder = result.order;

        // Reset inputs
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('discount-given').value = '';
        document.getElementById('payment-status-select').value = 'PAID';
        cart = [];
        updateCartUI();

        // Show the receipt modal
        showBill(savedOrder);
    } catch (err) {
        alert("Error saving bill to database: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Generate Bill";
    }
}

// ==========================================
// 5. RECEIPT POPUP
// ==========================================
function showBill(order) {
    const isPaid = (order.payment_status === 'PAID');
    const statusBadge = `<span class="badge-status ${isPaid ? 'badge-paid' : 'badge-unpaid'}">${order.payment_status}</span>`;
    
    const formattedDate = new Date(order.order_date).toLocaleString('en-IN');
    const items = order.items || [];

    const itemRows = items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td class="num">${item.quantity}</td>
            <td class="num">₹${parseFloat(item.price).toFixed(2)}</td>
            <td class="num">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    const subtotal = parseFloat(order.subtotal) || 0;
    const discount = parseFloat(order.discount_amount) || 0;
    const discountPercent = parseFloat(order.discount_percent) || 0;
    const total = parseFloat(order.total_amount) || 0;

    document.getElementById('bill-content').innerHTML = `
        <div class="bill-meta">
            <div><strong>Bill No:</strong> ${order.order_code}</div>
            <div><strong>Date:</strong> ${formattedDate}</div>
            <div><strong>Customer:</strong> ${order.customer_name}</div>
            <div><strong>Mobile:</strong> ${order.customer_phone}</div>
            <div style="grid-column: span 2; margin-top: 4px;">
                <strong>Payment Status:</strong> ${statusBadge}
            </div>
        </div>

        <table class="bill-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th class="num">Qty</th>
                    <th class="num">Price</th>
                    <th class="num">Amount</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <div class="bill-summary">
            <div class="summary-row"><span>Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
            <div class="summary-row"><span>Discount (${discountPercent}%):</span><span>- ₹${discount.toFixed(2)}</span></div>
            <div class="total-row"><span>Final Total:</span><span>₹${total.toFixed(2)}</span></div>
        </div>
    `;

    document.getElementById('bill-modal').classList.add('show');
}

function closeBill() {
    document.getElementById('bill-modal').classList.remove('show');
    switchPage('database-page');
}

// ==========================================
// 6. DATABASE PAGE & ANALYTICS
// ==========================================
async function loadDatabaseAnalytics() {
    const monthSelect = document.getElementById('db-month-select');
    const productSelect = document.getElementById('db-product-select');
    const paymentFilter = document.getElementById('db-payment-filter');

    // Populate products dropdown once
    if (!productsDropdownLoaded) {
        productSelect.innerHTML = '<option value="all">-- All Products --</option>' + 
            inventory.map(p => `<option value="${p.id}">${p.name} (₹${p.price})</option>`).join('');
        productsDropdownLoaded = true;
    }

    const selectedMonth = monthSelect.value || 'all';
    const selectedProduct = productSelect.value || 'all';
    const selectedPayment = paymentFilter.value || 'ALL';

    const url = `/api/reports/sales?month=${encodeURIComponent(selectedMonth)}&productId=${encodeURIComponent(selectedProduct)}&paymentStatus=${encodeURIComponent(selectedPayment)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            console.error('Failed to load database report:', data.error);
            return;
        }

        // Populate Month Dropdown if not loaded yet
        if (!monthsLoaded && data.availableMonths && data.availableMonths.length > 0) {
            let optionsHtml = '<option value="all">All Months</option>';
            data.availableMonths.forEach(m => {
                const dateObj = new Date(m + '-01');
                const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                optionsHtml += `<option value="${m}">${monthName} (${m})</option>`;
            });
            monthSelect.innerHTML = optionsHtml;
            if (data.selectedMonth && data.selectedMonth !== 'all') {
                monthSelect.value = data.selectedMonth;
            } else {
                monthSelect.value = 'all';
            }
            monthsLoaded = true;
        }

        // 1. Update Summary Stats
        document.getElementById('total-orders-count').textContent = data.summary.totalOrders;
        document.getElementById('total-sales-amount').textContent = `₹${data.summary.totalRevenue.toFixed(2)}`;
        document.getElementById('total-units-count').textContent = data.summary.totalUnits;
        document.getElementById('paid-sales-amount').textContent = `₹${data.summary.paidAmount.toFixed(2)}`;
        document.getElementById('unpaid-sales-amount').textContent = `₹${data.summary.unpaidAmount.toFixed(2)}`;

        // Notes
        const chosenProdName = selectedProduct === 'all' ? 'all items' : (inventory.find(p => p.id === selectedProduct)?.name || 'selected item');
        document.getElementById('product-units-note').textContent = `sold for ${chosenProdName}`;
        document.getElementById('orders-note').textContent = `in ${selectedMonth === 'all' ? 'All Months' : selectedMonth}`;

        // 2. Daily Sales Breakdown Table
        const dailyTbody = document.getElementById('daily-table-body');
        const dailyRangeLabel = document.getElementById('daily-sales-range-label');
        dailyRangeLabel.textContent = selectedMonth === 'all' ? 'All Dates Available' : `Month: ${selectedMonth}`;

        if (!data.dailySales || data.dailySales.length === 0) {
            dailyTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 22px; color: #94a3b8;">No per-day sales found for this filter.</td></tr>';
        } else {
            dailyTbody.innerHTML = data.dailySales.map(d => {
                const daySales = parseFloat(selectedProduct === 'all' ? d.order_sales_total : d.product_sales_total) || 0;
                return `
                    <tr>
                        <td><strong>${d.date}</strong></td>
                        <td><span style="color: #64748b;">${d.day_of_week}</span></td>
                        <td>${d.order_count} order(s)</td>
                        <td><strong style="color: #0284c7;">${d.units_sold} units</strong></td>
                        <td style="color: #10b981; font-weight: bold;">₹${daySales.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
        }

        // 3. Customer Orders Transactions Table
        const ordersTbody = document.getElementById('db-table-body');
        const ordersCountLabel = document.getElementById('orders-count-label');
        ordersCountLabel.textContent = `${data.orders.length} Order(s)`;

        if (!data.orders || data.orders.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 25px; color: #94a3b8;">No customer transactions found matching current criteria.</td></tr>';
        } else {
            ordersTbody.innerHTML = data.orders.map(order => {
                const isPaid = (order.payment_status === 'PAID');
                const badgeClass = isPaid ? 'badge-paid' : 'badge-unpaid';
                const nextActionText = isPaid ? 'Mark Unpaid' : 'Mark Paid';
                const totalAmt = parseFloat(order.total_amount) || 0;
                const discAmt = parseFloat(order.discount_amount) || 0;
                const discPercent = parseFloat(order.discount_percent) || 0;

                return `
                    <tr>
                        <td><strong>${order.order_code}</strong></td>
                        <td style="font-size:0.85rem; color:#64748b; white-space:nowrap;">${order.order_date}</td>
                        <td><strong>${order.customer_name}</strong></td>
                        <td>${order.customer_phone}</td>
                        <td style="color:#334155; font-size:0.9rem;">${order.items_summary}</td>
                        <td style="color:#64748b;">${discPercent}% (₹${discAmt.toFixed(2)})</td>
                        <td style="font-weight:bold; color:#0f172a;">₹${totalAmt.toFixed(2)}</td>
                        <td>
                            <span class="badge-status ${badgeClass}">${order.payment_status}</span>
                        </td>
                        <td>
                            <button class="toggle-btn" onclick="togglePaymentStatus(${order.id})">${nextActionText}</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

    } catch (err) {
        console.error('Error fetching database report:', err);
    }
}

// Interactive Toggle Payment Status in MySQL
async function togglePaymentStatus(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}/payment`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const result = await response.json();
        if (result.success) {
            loadDatabaseAnalytics();
        } else {
            alert('Could not update status: ' + result.error);
        }
    } catch (err) {
        alert('Network error updating status: ' + err.message);
    }
}

// Initialize on Load
window.onload = async () => {
    await fetchProductsFromDB();
    switchPage('home-page');
};
