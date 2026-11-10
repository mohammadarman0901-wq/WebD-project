const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
const DB_NAME = process.env.DB_NAME || 'shop_db';

// Primary connection pool
const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

/**
 * Automatically initializes database, tables, and seed data from schema.sql
 * if they are not already set up.
 */
async function initDatabase() {
    try {
        // Attempt initial connection to shop_db
        const connection = await pool.getConnection();
        console.log(`[DB] Connected successfully to MySQL/MariaDB (${DB_HOST}:${DB_PORT}/${DB_NAME})`);

        // Check if tables exist
        try {
            const [rows] = await connection.query('SELECT COUNT(*) AS count FROM products');
            console.log(`[DB] Schema verified. Products available in database: ${rows[0].count}`);
        } catch (tableErr) {
            if (tableErr.code === 'ER_NO_SUCH_TABLE') {
                console.log('[DB] Tables missing. Initializing tables and seed data from schema.sql...');
                const schemaPath = path.join(__dirname, 'schema.sql');
                if (fs.existsSync(schemaPath)) {
                    const sql = fs.readFileSync(schemaPath, 'utf8');
                    await connection.query(sql);
                    console.log('[DB] Tables created and seeded successfully from schema.sql.');
                }
            } else {
                throw tableErr;
            }
        }
        connection.release();
    } catch (err) {
        if (err.code === 'ER_BAD_DB_ERROR') {
            // Database does not exist yet; create it automatically using root credentials
            console.log(`[DB] Database '${DB_NAME}' does not exist. Creating automatically...`);
            try {
                const adminConn = await mysql.createConnection({
                    host: DB_HOST,
                    port: DB_PORT,
                    user: DB_USER,
                    password: DB_PASSWORD,
                    multipleStatements: true
                });
                
                const schemaPath = path.join(__dirname, 'schema.sql');
                if (fs.existsSync(schemaPath)) {
                    const sql = fs.readFileSync(schemaPath, 'utf8');
                    await adminConn.query(sql);
                    console.log(`[DB] Database '${DB_NAME}' and all tables initialized from schema.sql.`);
                } else {
                    await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
                    console.log(`[DB] Database '${DB_NAME}' created.`);
                }
                await adminConn.end();
            } catch (createErr) {
                console.error('[DB] Failed to auto-create database:', createErr.message);
                printTroubleshooting(createErr);
            }
        } else {
            console.error('[DB Connection Error]:', err.message);
            printTroubleshooting(err);
        }
    }
}

function printTroubleshooting(err) {
    console.log('-------------------------------------------------------');
    console.log('[DB Troubleshooting Tips]:');
    console.log(` 1. Ensure MySQL/MariaDB is running on host '${DB_HOST}' and port ${DB_PORT}.`);
    console.log(` 2. Check credentials in your '.env' file:`);
    console.log(`    - DB_USER: '${DB_USER}'`);
    console.log(`    - DB_PASSWORD: '${DB_PASSWORD ? '******' : '(empty)'}'`);
    console.log(` 3. If needed, manually import 'schema.sql' into your MySQL client / phpMyAdmin.`);
    console.log('-------------------------------------------------------');
}

module.exports = {
    pool,
    initDatabase
};
