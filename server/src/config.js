const path = require("node:path");
require("dotenv").config({
 path: path.resolve(__dirname, "../.env"),
 quiet: true,
});
const config = {
 port: Number(process.env.PORT || 3000),
 origin: process.env.APP_ORIGIN || "http://localhost:5173",
 db: {
 host: process.env.DB_HOST || "127.0.0.1",
 port: Number(process.env.DB_PORT || 3306),
 user: process.env.DB_USER || "root",
 password: process.env.DB_PASSWORD || "",
 database: process.env.DB_NAME || "technest_course",
 },
 jwtSecret: process.env.JWT_SECRET || "",
 jwtExpires: process.env.JWT_EXPIRES_IN || "30m",
 issuer: process.env.JWT_ISSUER || "technest",
 audience: process.env.JWT_AUDIENCE || "technest-web",
 production: process.env.NODE_ENV === "production",
};
module.exports = config;