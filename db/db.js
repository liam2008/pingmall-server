const mysql = require('mysql');
const config = require('./config');
const conn = mysql.createConnection(config);
conn.connect();

module.exports = conn;