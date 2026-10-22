const sql = require("mssql");

function databaseConfig() {
  const server = process.env.DB_SERVER;
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  if (!server || !database || !user || !password) {
    throw new Error("Set DB_SERVER, DB_NAME, DB_USER, and DB_PASSWORD in the .env file.");
  }
  return {
    server,
    port: Number(process.env.DB_PORT || 1433),
    database,
    user,
    password,
    options: {
      encrypt: process.env.DB_ENCRYPT !== "false",
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    },
    pool: { min: 0, max: 10, idleTimeoutMillis: 30000 },
  };
}

async function createPool() {
  return new sql.ConnectionPool(databaseConfig()).connect();
}

module.exports = { sql, databaseConfig, createPool };
