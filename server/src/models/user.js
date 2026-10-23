const { pool } = require("../db");
exports.byUsername = async (username) => {
 const [r] = await pool.execute("SELECT * FROM users WHERE username=?", [
 username,
 ]);
 return r[0];
};
exports.byId = async (id) => {
 const [r] = await pool.execute(
 "SELECT id,username,fullname,role,auth_version FROM users WHERE id=?",
 [id],
 );
 return r[0];
};
exports.create = async (username, fullname, hash) => {
 await pool.execute(
 "INSERT INTO users(username,fullname,password_hash,role) VALUES(?,?,?,?)",
 [username, fullname, hash, "customer"],
 );
};
exports.revoke = async (id) => {
 await pool.execute(
 "UPDATE users SET auth_version=auth_version+1 WHERE id=?",
 [id],
 );
};