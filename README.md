# Zenzy Clothing Wear - Full-Stack POS & MySQL Database System

A responsive, full-stack Point of Sale (POS) and inventory sales database application built with **HTML5, CSS3, JavaScript, Node.js, Express.js, and MySQL / MariaDB**.

---

## 📋 Prerequisites

To run this project on your computer, ensure you have:

1. **Node.js** (v16 or higher) and **npm**  
   Download from: [https://nodejs.org/](https://nodejs.org/)
2. **MySQL or MariaDB Database Server**  
   Any standard MySQL / MariaDB installation (e.g. MySQL Installer, MariaDB, XAMPP, or WampServer) running on your computer.

---

## 🚀 Quick Start Guide (For Teacher / Evaluator)

### Step 1: Clone or Extract the Project
Extract the project folder or clone it from GitHub to any directory on your computer.

### Step 2: Configure Database Credentials (`.env`)
The project includes a template file named **`.env.example`**.
If `.env` does not exist, copy `.env.example` to `.env` (or let `start.bat` create it automatically).

Edit `.env` to match your local MySQL settings:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=shop_db
```
*(If your MySQL user `root` has no password, leave `DB_PASSWORD=` blank).*

### Step 3: Run the Application

#### Option A: One-Click Windows Launcher (Recommended)
Simply double-click the **`start.bat`** file.
It will automatically:
1. Verify Node.js, npm, and MySQL port availability.
2. Install dependencies (`npm install`) if running for the first time.
3. Automatically create the database `shop_db`, create tables, and populate initial demonstration data from `schema.sql`.
4. Launch the application in your default web browser at `http://localhost:3000`.

#### Option B: Command Line (Cross-Platform)
```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start
```
Then open `http://localhost:3000` in your browser.

> **Note on Database Initialization**:  
> The backend automatically checks and initializes the database `shop_db` and all tables from `schema.sql` on the first launch.  
> If you prefer to manually import the database, you can run:
> ```bash
> mysql -u root -p < schema.sql
> ```
> or import `schema.sql` using **phpMyAdmin** or **MySQL Workbench**.

---

## 🗄️ Database Architecture (`shop_db`)

The database consists of three relational tables:

### 1. `products`
Stores clothing items, prices, and catalog images:
- `id` (VARCHAR(20), Primary Key) - Unique product code (e.g. `Z01`, `Z02`)
- `name` (VARCHAR(150)) - Product title
- `price` (DECIMAL(10,2)) - Price in ₹
- `image` (TEXT) - Product image URL
- `created_at` (TIMESTAMP) - Record creation time

### 2. `orders`
Stores customer transaction bills and payment status:
- `id` (INT, Auto Increment Primary Key)
- `order_code` (VARCHAR(50), Unique) - Unique bill reference (e.g. `ZENZY-10492`)
- `customer_name` (VARCHAR(150)) - Customer full name
- `customer_phone` (VARCHAR(30)) - Customer mobile number
- `subtotal` (DECIMAL(10,2)) - Order subtotal
- `discount_percent` (DECIMAL(5,2)) - Discount % given
- `discount_amount` (DECIMAL(10,2)) - Discount deduction in ₹
- `total_amount` (DECIMAL(10,2)) - Final bill amount
- `payment_status` (ENUM('PAID', 'NOT PAID')) - Payment confirmation
- `order_date` (DATETIME) - Date and time of purchase

### 3. `order_items`
Stores the individual products and quantities in each customer order:
- `id` (INT, Auto Increment Primary Key)
- `order_id` (INT, Foreign Key referencing `orders.id` ON DELETE CASCADE)
- `product_id` (VARCHAR(20), Foreign Key referencing `products.id`)
- `product_name` (VARCHAR(150)) - Name of product
- `unit_price` (DECIMAL(10,2)) - Price per unit
- `quantity` (INT) - Units bought
- `item_total` (DECIMAL(10,2)) - Line total

---

## 🎓 Teacher Evaluation & Demonstration Guide

### 1. POS Billing & Receipt Generation
1. Click **"Select Your Order"** from the top navigation bar.
2. Select clothing items to add them to the bill.
3. Enter **Customer Name**, **Mobile Number**, and optional **Discount %**.
4. Select the **Payment Status** (`Paid` or `Not Paid`).
5. Click **"Generate Bill"**:
   - An itemized receipt modal appears displaying the Bill Number, Customer details, Item breakdown, and Payment Status badge.
   - The transaction is recorded directly into MySQL tables (`orders` and `order_items`).

### 2. Sales Database & Analytics
Click **"Database"** from the top navigation bar:
- **Monthly Sales Filtering**: Use the **"Select Month"** dropdown to switch between months (e.g. October, November). The summary cards and sales tables update dynamically.
- **Product-Specific Sales**: Use the **"Select Product"** dropdown (e.g., select *Zenzy Graphic T-Shirt*). The system calculates the exact number of units sold and revenue contributed by that specific product for the chosen month.
- **Per-Day Sales Breakdown**: The table displays daily sales data (Date, Day of Week, Order Count, Units Sold, and Total Daily Revenue).
- **Payment Status Tracking**:
  - Filter by `All Status`, `Paid Only`, or `Not Paid Only`.
  - In the Customer Orders History table, click **"Mark Paid"** or **"Mark Unpaid"** to toggle a customer's payment status in MySQL in real time.

---

## 📁 Project File Structure

```text
├── index.html          # Frontend POS interface and navigation
├── style.css           # Modern stylesheet
├── app.js              # Client-side logic, cart management, and API calls
├── server.js           # Express REST API backend
├── db.js               # MySQL connection pool & automatic database initializer
├── schema.sql          # SQL schema definitions, constraints, and demonstration seed data
├── start.bat           # Portable Windows one-click launcher
├── package.json        # Dependencies (express, mysql2, cors, dotenv)
├── .env.example        # Configuration template
├── .gitignore          # Git ignore rules (node_modules, .env, mysql_data)
└── README.md           # Documentation and evaluation guide
```
