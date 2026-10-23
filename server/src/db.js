const mysql = require("mysql2/promise");
const config = require("./config");
const pool = mysql.createPool({
 ...config.db,
 connectionLimit: 10,
 waitForConnections: true,
 decimalNumbers: false,
 supportBigNumbers: true,
 bigNumberStrings: true,
 timezone: "Z",
});
// Keep MySQL TIMESTAMP values and mysql2 date parsing in UTC.
pool.on('connection', (connection) => {
 connection.query("SET time_zone = '+00:00'");
});
async function transaction(work) {
 const conn = await pool.getConnection();
 try {
 await conn.beginTransaction();
 const value = await work(conn);
 await conn.commit();
 return value;
 } catch (err) {
 await conn.rollback();
 throw err;
 } finally {
 conn.release();
 }
}
module.exports = { pool, transaction };