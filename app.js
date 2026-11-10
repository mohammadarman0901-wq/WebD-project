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
                            <div class="action-btn-group">
                                <button class="edit-btn" onclick="openEditModal(${order.id})">✏️ Edit</button>
                                <button class="toggle-btn" onclick="togglePaymentStatus(${order.id})">${nextActionText}</button>
                            </div>
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

// ==========================================
// 7. ORDER EDIT FUNCTIONALITY
// ==========================================
let currentEditingOrder = null;
let editItems = [];

async function openEditModal(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        const result = await response.json();

        if (!result.success || !result.order) {
            return alert('Error loading order details: ' + (result.error || 'Not found'));
        }

        const order = result.order;
        currentEditingOrder = order;

        // Populate fields
        document.getElementById('edit-order-id').value = order.id;
        document.getElementById('edit-modal-title').textContent = `Edit Order: ${order.order_code}`;
        document.getElementById('edit-customer-name').value = order.customer_name;
        document.getElementById('edit-customer-phone').value = order.customer_phone;
        document.getElementById('edit-order-date').value = order.datetime_local || '';
        document.getElementById('edit-payment-status').value = order.payment_status;
        document.getElementById('edit-discount-percent').value = parseFloat(order.discount_percent) || 0;
        document.getElementById('edit-grand-total').value = parseFloat(order.total_amount).toFixed(2);

        // Load items
        editItems = (order.items && order.items.length > 0)
            ? order.items.map(i => ({
                product_id: i.product_id,
                product_name: i.product_name,
                unit_price: parseFloat(i.unit_price) || 0,
                quantity: parseInt(i.quantity, 10) || 1
            }))
            : [{
                product_id: inventory[0].id,
                product_name: inventory[0].name,
                unit_price: inventory[0].price,
                quantity: 1
            }];

        renderEditItemsList();
        recalcEditTotals(false); // keep existing final price on initial open

        document.getElementById('edit-order-modal').classList.add('show');
    } catch (err) {
        alert('Failed to fetch order for editing: ' + err.message);
    }
}

function closeEditModal() {
    document.getElementById('edit-order-modal').classList.remove('show');
    currentEditingOrder = null;
    editItems = [];
}

function renderEditItemsList() {
    const container = document.getElementById('edit-items-list');
    if (!container) return;

    if (editItems.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; font-size:0.9rem; text-align:center;">No items. Click "+ Add Item" above.</p>';
        return;
    }

    container.innerHTML = editItems.map((item, idx) => {
        const productOptions = inventory.map(p => 
            `<option value="${p.id}" ${p.id === item.product_id ? 'selected' : ''}>${p.name} (₹${p.price})</option>`
        ).join('');

        const lineTotal = (item.unit_price * item.quantity).toFixed(2);

        return `
            <div class="edit-item-row">
                <div>
                    <label style="font-size:0.75rem; color:#64748b; display:block;">Product</label>
                    <select onchange="onEditProductSelect(${idx}, this.value)" style="width: 100%;">
                        ${productOptions}
                    </select>
                </div>
                <div>
                    <label style="font-size:0.75rem; color:#64748b; display:block;">Price (₹)</label>
                    <input type="number" min="0" step="any" value="${item.unit_price}" oninput="onEditUnitPriceChange(${idx}, this.value)" style="width: 100%;">
                </div>
                <div>
                    <label style="font-size:0.75rem; color:#64748b; display:block;">Qty</label>
                    <input type="number" min="1" value="${item.quantity}" oninput="onEditQuantityChange(${idx}, this.value)" style="width: 100%;">
                </div>
                <div>
                    <label style="font-size:0.75rem; color:#64748b; display:block;">Total</label>
                    <span style="font-weight: bold; color: var(--primary); display:block; padding-top:6px;">₹${lineTotal}</span>
                </div>
                <div>
                    <label style="font-size:0.75rem; display:block; visibility:hidden;">Del</label>
                    <button type="button" class="remove-item-btn" title="Remove item" onclick="removeEditItemRow(${idx})">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function addEditItemRow() {
    const defaultProduct = inventory[0] || { id: 'Z01', name: 'Item', price: 500 };
    editItems.push({
        product_id: defaultProduct.id,
        product_name: defaultProduct.name,
        unit_price: parseFloat(defaultProduct.price),
        quantity: 1
    });
    renderEditItemsList();
    recalcEditTotals(true);
}

function removeEditItemRow(index) {
    if (editItems.length <= 1) {
        return alert("An order must have at least one item.");
    }
    editItems.splice(index, 1);
    renderEditItemsList();
    recalcEditTotals(true);
}

function onEditProductSelect(index, productId) {
    const prod = inventory.find(p => p.id === productId);
    if (prod && editItems[index]) {
        editItems[index].product_id = prod.id;
        editItems[index].product_name = prod.name;
        editItems[index].unit_price = parseFloat(prod.price);
        renderEditItemsList();
        recalcEditTotals(true);
    }
}

function onEditQuantityChange(index, val) {
    const qty = parseInt(val, 10);
    if (!isNaN(qty) && qty > 0 && editItems[index]) {
        editItems[index].quantity = qty;
        recalcEditTotals(true);
        // Update just the line total display without re-rendering to keep input focus
        const rows = document.querySelectorAll('.edit-item-row');
        if (rows[index]) {
            const totalSpan = rows[index].querySelector('span');
            if (totalSpan) totalSpan.textContent = `₹${(editItems[index].unit_price * qty).toFixed(2)}`;
        }
    }
}

function onEditUnitPriceChange(index, val) {
    const price = parseFloat(val);
    if (!isNaN(price) && price >= 0 && editItems[index]) {
        editItems[index].unit_price = price;
        recalcEditTotals(true);
        const rows = document.querySelectorAll('.edit-item-row');
        if (rows[index]) {
            const totalSpan = rows[index].querySelector('span');
            if (totalSpan) totalSpan.textContent = `₹${(price * editItems[index].quantity).toFixed(2)}`;
        }
    }
}

function onEditDiscountInput() {
    recalcEditTotals(true);
}

function recalcEditTotals(updateGrandTotal = true) {
    const subtotal = editItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const discPercent = Math.min(Math.max(parseFloat(document.getElementById('edit-discount-percent').value) || 0, 0), 100);
    const discAmount = Math.round((subtotal * discPercent) / 100 * 100) / 100;

    const subtotalEl = document.getElementById('edit-calc-subtotal');
    const discountEl = document.getElementById('edit-discount-amount');
    const grandTotalInput = document.getElementById('edit-grand-total');

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (discountEl) discountEl.textContent = `- ₹${discAmount.toFixed(2)} (${discPercent}%)`;

    if (updateGrandTotal && grandTotalInput) {
        const finalPrice = Math.max(0, subtotal - discAmount);
        grandTotalInput.value = finalPrice.toFixed(2);
    }
}

async function submitOrderEdit(event) {
    event.preventDefault();
    const saveBtn = document.getElementById('save-edit-btn');
    const orderId = document.getElementById('edit-order-id').value;

    const customerName = document.getElementById('edit-customer-name').value.trim();
    const customerPhone = document.getElementById('edit-customer-phone').value.trim();
    const orderDate = document.getElementById('edit-order-date').value;
    const paymentStatus = document.getElementById('edit-payment-status').value;
    const discountPercent = parseFloat(document.getElementById('edit-discount-percent').value) || 0;
    const grandTotal = parseFloat(document.getElementById('edit-grand-total').value);

    if (!customerName || !customerPhone) {
        return alert("Please enter Customer Name and Mobile Number.");
    }

    if (!orderDate) {
        return alert("Please select Order Date & Time.");
    }

    if (editItems.length === 0) {
        return alert("Please include at least one item in the order.");
    }

    if (isNaN(grandTotal) || grandTotal < 0) {
        return alert("Please enter a valid Final Price.");
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving to Database...";

    const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        order_date: orderDate,
        payment_status: paymentStatus,
        discount_percent: discountPercent,
        total_amount: grandTotal,
        items: editItems
    };

    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to update order');
        }

        closeEditModal();
        // Refresh database overview immediately
        await loadDatabaseAnalytics();
        alert('Order updated successfully in MySQL database!');
    } catch (err) {
        alert('Error updating order: ' + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Changes to Database";
    }
}

// Initialize on Load
window.onload = async () => {
    await fetchProductsFromDB();
    switchPage('home-page');
};
