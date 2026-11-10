-- ========================================================
-- Zenzy Clothing Wear - Database Schema & Initial Data
-- ========================================================

-- Create database if it does not already exist
CREATE DATABASE IF NOT EXISTS shop_db;
USE shop_db;

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Orders Table (Stores customer bills and payment status)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('PAID', 'NOT PAID') NOT NULL DEFAULT 'PAID',
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_date (order_date),
    INDEX idx_payment_status (payment_status)
);

-- 3. Order Items Table (Stores line items for each customer order)
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    item_total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

-- ========================================================
-- Seed Product Catalog
-- ========================================================
INSERT INTO products (id, name, price, image) VALUES
('Z01', 'Zenzy Graphic T-Shirt', 599.00, 'https://assets.myntassets.com/w_412,q_50,,dpr_3,fl_progressive,f_webp/assets/images/22194038/2024/9/28/7159f452-c0b6-4cf6-98f7-f0bcff82f3021727530844469-VEIRDO-Graphic-Printed-Oversized-Fit-Cotton-T-shirt-42172753-1.jpg'),
('Z02', 'Classic Polo Shirt', 899.00, 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&q=80'),
('Z03', 'Slim Fit Denim Jeans', 1299.00, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80'),
('Z04', 'Cotton Chinos', 1150.00, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80'),
('Z05', 'Winter Hoodie', 1499.00, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80'),
('Z06', 'Formal White Shirt', 999.00, 'https://www.myntra.com/shirts/hancock/hancock-men-white-slim-fit-solid-formal-shirt/11103910/buy'),
('Z07', 'Classic Black Crew Neck T-Shirt', 499.00, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80'),
('Z08', 'Blue Linen Casual Shirt', 1199.00, 'https://images.unsplash.com/photo-1740711152088-88a009e877bb?w=500&q=80'),
('Z09', 'Plain White T-Shirt', 399.00, 'https://images.unsplash.com/photo-1778671394516-8270eac13c42?w=500&q=80'),
('Z10', 'Casual Everyday Wear', 799.00, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80'),
('Z11', 'White Full Sleeve Sweatshirt', 1099.00, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80'),
('Z12', 'Classic Blue Jeans', 1399.00, 'https://images.unsplash.com/photo-1714143136372-ddaf8b606da7?w=500&q=80'),
('Z13', 'Pink Cargo Joggers', 1299.00, 'https://images.unsplash.com/photo-1789110520495-8f1b8545c0ff?w=500&q=80')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), image=VALUES(image);

-- ========================================================
-- Seed Initial Demonstration Orders
-- (Multi-month and multi-day data for immediate demonstration)
-- ========================================================

-- Demo Order 1: Aarav Sharma (Oct 10, Paid)
INSERT INTO orders (id, order_code, customer_name, customer_phone, subtotal, discount_percent, discount_amount, total_amount, payment_status, order_date)
VALUES (1, 'ZENZY-10492', 'Aarav Sharma', '9876543210', 1498.00, 10.00, 149.80, 1348.20, 'PAID', '2026-10-10 11:30:00')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, item_total)
VALUES 
(1, 'Z01', 'Zenzy Graphic T-Shirt', 599.00, 1, 599.00),
(1, 'Z02', 'Classic Polo Shirt', 899.00, 1, 899.00)
ON DUPLICATE KEY UPDATE id=id;

-- Demo Order 2: Priya Patel (Oct 15, Paid)
INSERT INTO orders (id, order_code, customer_name, customer_phone, subtotal, discount_percent, discount_amount, total_amount, payment_status, order_date)
VALUES (2, 'ZENZY-29184', 'Priya Patel', '9812345678', 2798.00, 5.00, 139.90, 2658.10, 'PAID', '2026-10-15 15:45:00')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, item_total)
VALUES 
(2, 'Z03', 'Slim Fit Denim Jeans', 1299.00, 1, 1299.00),
(2, 'Z05', 'Winter Hoodie', 1499.00, 1, 1499.00)
ON DUPLICATE KEY UPDATE id=id;

-- Demo Order 3: Rohan Mehta (Oct 22, Not Paid)
INSERT INTO orders (id, order_code, customer_name, customer_phone, subtotal, discount_percent, discount_amount, total_amount, payment_status, order_date)
VALUES (3, 'ZENZY-38192', 'Rohan Mehta', '9988776655', 1198.00, 0.00, 0.00, 1198.00, 'NOT PAID', '2026-10-22 18:20:00')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, item_total)
VALUES 
(3, 'Z01', 'Zenzy Graphic T-Shirt', 599.00, 2, 1198.00)
ON DUPLICATE KEY UPDATE id=id;

-- Demo Order 4: Sneha Gupta (Oct 28, Paid)
INSERT INTO orders (id, order_code, customer_name, customer_phone, subtotal, discount_percent, discount_amount, total_amount, payment_status, order_date)
VALUES (4, 'ZENZY-49201', 'Sneha Gupta', '9123456780', 2149.00, 10.00, 214.90, 1934.10, 'PAID', '2026-10-28 14:10:00')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, item_total)
VALUES 
(4, 'Z04', 'Cotton Chinos', 1150.00, 1, 1150.00),
(4, 'Z06', 'Formal White Shirt', 999.00, 1, 999.00)
ON DUPLICATE KEY UPDATE id=id;

-- Demo Order 5: Vikram Singh (Nov 02, Paid)
INSERT INTO orders (id, order_code, customer_name, customer_phone, subtotal, discount_percent, discount_amount, total_amount, payment_status, order_date)
VALUES (5, 'ZENZY-58190', 'Vikram Singh', '9871122334', 1798.00, 15.00, 269.70, 1528.30, 'PAID', '2026-11-02 12:00:00')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, item_total)
VALUES 
(5, 'Z01', 'Zenzy Graphic T-Shirt', 599.00, 1, 599.00),
(5, 'Z08', 'Blue Linen Casual Shirt', 1199.00, 1, 1199.00)
ON DUPLICATE KEY UPDATE id=id;

-- Demo Order 6: Ananya Roy (Nov 05, Not Paid)
INSERT INTO orders (id, order_code, customer_name, customer_phone, subtotal, discount_percent, discount_amount, total_amount, payment_status, order_date)
VALUES (6, 'ZENZY-67219', 'Ananya Roy', '9833445566', 1499.00, 0.00, 0.00, 1499.00, 'NOT PAID', '2026-11-05 16:35:00')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, item_total)
VALUES 
(6, 'Z05', 'Winter Hoodie', 1499.00, 1, 1499.00)
ON DUPLICATE KEY UPDATE id=id;

-- Demo Order 7: Karan Johar (Nov 08, Paid)
INSERT INTO orders (id, order_code, customer_name, customer_phone, subtotal, discount_percent, discount_amount, total_amount, payment_status, order_date)
VALUES (7, 'ZENZY-78210', 'Karan Johar', '9711223344', 2698.00, 8.00, 215.84, 2482.16, 'PAID', '2026-11-08 19:15:00')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, item_total)
VALUES 
(7, 'Z03', 'Slim Fit Denim Jeans', 1299.00, 1, 1299.00),
(7, 'Z12', 'Classic Blue Jeans', 1399.00, 1, 1399.00)
ON DUPLICATE KEY UPDATE id=id;

-- Demo Order 8: Pooja Mehra (Nov 10, Paid)
INSERT INTO orders (id, order_code, customer_name, customer_phone, subtotal, discount_percent, discount_amount, total_amount, payment_status, order_date)
VALUES (8, 'ZENZY-89102', 'Pooja Mehra', '9911447788', 1797.00, 10.00, 179.70, 1617.30, 'PAID', '2026-11-10 10:45:00')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, item_total)
VALUES 
(8, 'Z01', 'Zenzy Graphic T-Shirt', 599.00, 3, 1797.00)
ON DUPLICATE KEY UPDATE id=id;
