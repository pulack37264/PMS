require("dotenv").config();

const path = require("node:path");
const { randomUUID } = require("node:crypto");
const express = require("express");
const { sql, createPool } = require("./sql");

const app = express();
const frontendRoot = path.resolve(__dirname, "..", "frontend");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const collections = {
  inventory: {
    table: "dbo.FuelProducts",
    fields: [
      ["name", "name", sql.NVarChar(120), "text"],
      ["type", "type", sql.NVarChar(40), "text"],
      ["unit", "unit", sql.NVarChar(8), "text"],
      ["stock", "stock", sql.Decimal(18, 3), "nonnegative"],
      ["capacity", "capacity", sql.Decimal(18, 3), "positive"],
      ["reorderLevel", "reorder_level", sql.Decimal(18, 3), "nonnegative"],
      ["costPrice", "cost_price", sql.Decimal(12, 4), "nonnegative"],
      ["sellPrice", "sell_price", sql.Decimal(12, 4), "positive"],
      ["supplier", "supplier", sql.NVarChar(160), "optionalText"],
    ],
  },
  customers: {
    table: "dbo.Customers",
    fields: [
      ["name", "name", sql.NVarChar(160), "text"],
      ["phone", "phone", sql.NVarChar(40), "text"],
      ["email", "email", sql.NVarChar(254), "optionalText"],
      ["balance", "balance", sql.Decimal(18, 2), "nonnegative"],
      ["status", "status", sql.NVarChar(30), "text"],
    ],
  },
  expenses: {
    table: "dbo.Expenses",
    fields: [
      ["date", "expense_date", sql.Date, "date"],
      ["category", "category", sql.NVarChar(50), "text"],
      ["description", "description", sql.NVarChar(240), "text"],
      ["amount", "amount", sql.Decimal(18, 2), "positive"],
      ["paymentMethod", "payment_method", sql.NVarChar(40), "text"],
    ],
  },
  staff: {
    table: "dbo.Staff",
    fields: [
      ["name", "name", sql.NVarChar(120), "text"],
      ["role", "role", sql.NVarChar(80), "text"],
      ["phone", "phone", sql.NVarChar(40), "text"],
      ["shift", "shift", sql.NVarChar(30), "text"],
      ["status", "status", sql.NVarChar(30), "text"],
    ],
  },
};

app.use(express.json({ limit: "64kb" }));

function requiredText(body, key, maxLength) {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${key} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new ApiError(400, `${key} must be ${maxLength} characters or fewer.`);
  return trimmed;
}

function optionalText(body, key, maxLength) {
  const value = body[key] ?? "";
  if (typeof value !== "string") throw new ApiError(400, `${key} must be text.`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new ApiError(400, `${key} must be ${maxLength} characters or fewer.`);
  return trimmed;
}

function objectBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }
  return body;
}

function numeric(body, key, { allowZero = false } = {}) {
  const value = Number(body[key]);
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
    throw new ApiError(400, `${key} must be a ${allowZero ? "non-negative" : "positive"} number.`);
  }
  return value;
}

function dateValue(body, key) {
  const value = body[key];
  const parsed = typeof value === "string" ? new Date(`${value}T00:00:00Z`) : null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed?.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new ApiError(400, `${key} must be a valid date in YYYY-MM-DD format.`);
  }
  return value;
}

function validateInventory(values) {
  if (values.stock > values.capacity) throw new ApiError(400, "Current stock cannot exceed tank capacity.");
  if (values.reorderLevel > values.capacity) throw new ApiError(400, "Reorder level cannot exceed tank capacity.");
}

async function rollbackTransaction(transaction) {
  try {
    await transaction.rollback();
  } catch (error) {
    console.error("FuelFlow could not roll back a database transaction:", error.message);
  }
}

function readFields(config, body) {
  body = objectBody(body);
  const values = {};
  for (const [key, , , kind] of config.fields) {
    if (kind === "text") values[key] = requiredText(body, key, config.fields.find((field) => field[0] === key)[2].length);
    else if (kind === "optionalText") values[key] = optionalText(body, key, config.fields.find((field) => field[0] === key)[2].length);
    else if (kind === "positive") values[key] = numeric(body, key);
    else if (kind === "nonnegative") values[key] = numeric(body, key, { allowZero: true });
    else if (kind === "date") values[key] = dateValue(body, key);
  }
  return values;
}

function attachValues(request, config, values) {
  for (const [key, , type] of config.fields) request.input(key, type, values[key]);
  return request;
}

function assertId(id) {
  if (!uuidPattern.test(id)) throw new ApiError(400, "Record ID must be a valid UUID.");
}

async function loadWorkspace(pool) {
  const [inventory, sales, customers, purchases, expenses, staff] = await Promise.all([
    pool.request().query(`SELECT CONVERT(varchar(36), id) AS id, name, type, unit, stock, capacity,
      reorder_level AS reorderLevel, cost_price AS costPrice, sell_price AS sellPrice, supplier
      FROM dbo.FuelProducts ORDER BY name`),
    pool.request().query(`SELECT CONVERT(varchar(36), s.id) AS id, s.sale_number AS saleNumber,
      CONVERT(char(10), s.sale_date, 23) AS date, c.name AS customer, p.name AS product,
      s.quantity, s.unit_price AS unitPrice, s.total, s.payment, s.status
      FROM dbo.Sales s JOIN dbo.Customers c ON c.id = s.customer_id
      JOIN dbo.FuelProducts p ON p.id = s.product_id ORDER BY s.sale_date DESC, s.sale_number DESC`),
    pool.request().query(`SELECT CONVERT(varchar(36), id) AS id, name, phone, email, balance, status
      FROM dbo.Customers ORDER BY name`),
    pool.request().query(`SELECT CONVERT(varchar(36), p.id) AS id, p.purchase_number AS purchaseNumber,
      CONVERT(char(10), p.delivery_date, 23) AS date, p.supplier, f.name AS product,
      p.quantity, p.unit_cost AS unitCost, p.total, p.status
      FROM dbo.Purchases p JOIN dbo.FuelProducts f ON f.id = p.product_id
      ORDER BY p.delivery_date DESC, p.purchase_number DESC`),
    pool.request().query(`SELECT CONVERT(varchar(36), id) AS id, CONVERT(char(10), expense_date, 23) AS date,
      category, description, amount, payment_method AS paymentMethod
      FROM dbo.Expenses ORDER BY expense_date DESC, id DESC`),
    pool.request().query(`SELECT CONVERT(varchar(36), id) AS id, name, role, phone, shift, status
      FROM dbo.Staff ORDER BY name`),
  ]);
  return {
    inventory: inventory.recordset,
    sales: sales.recordset,
    customers: customers.recordset,
    purchases: purchases.recordset,
    expenses: expenses.recordset,
    staff: staff.recordset,
  };
}

async function getRecord(pool, collection, id) {
  const workspace = await loadWorkspace(pool);
  const record = workspace[collection].find((item) => item.id === id);
  if (!record) throw new ApiError(404, "Record not found.");
  return record;
}

function addBasicRoutes(collection, config) {
  app.post(`/api/${collection}`, async (req, res, next) => {
    try {
      const pool = req.app.locals.pool;
      const values = readFields(config, req.body);
      if (collection === "inventory") validateInventory(values);
      const columns = config.fields.map(([, column]) => column);
      const parameters = config.fields.map(([key]) => `@${key}`);
      const request = attachValues(pool.request(), config, values);
      const result = await request.query(`INSERT INTO ${config.table} (${columns.join(", ")})
        OUTPUT CONVERT(varchar(36), inserted.id) AS id
        VALUES (${parameters.join(", ")})`);
      res.status(201).json(await getRecord(pool, collection, result.recordset[0].id));
    } catch (error) {
      next(error);
    }
  });

  app.put(`/api/${collection}/:id`, async (req, res, next) => {
    try {
      const pool = req.app.locals.pool;
      assertId(req.params.id);
      const values = readFields(config, req.body);
      if (collection === "inventory") validateInventory(values);
      const assignments = config.fields.map(([key, column]) => `${column} = @${key}`);
      const request = attachValues(pool.request(), config, values)
        .input("id", sql.UniqueIdentifier, req.params.id);
      const result = await request.query(`UPDATE ${config.table} SET ${assignments.join(", ")}
        WHERE id = @id; SELECT @@ROWCOUNT AS affected`);
      if (!result.recordset[0]?.affected) throw new ApiError(404, "Record not found.");
      res.json(await getRecord(pool, collection, req.params.id));
    } catch (error) {
      next(error);
    }
  });

  app.delete(`/api/${collection}/:id`, async (req, res, next) => {
    try {
      const pool = req.app.locals.pool;
      assertId(req.params.id);
      if (collection === "customers") {
        const result = await pool.request()
          .input("id", sql.UniqueIdentifier, req.params.id)
          .query(`SELECT c.balance, (SELECT COUNT_BIG(*) FROM dbo.Sales s WHERE s.customer_id = c.id) AS salesCount
            FROM dbo.Customers c WHERE c.id = @id`);
        const customer = result.recordset[0];
        if (!customer) throw new ApiError(404, "Record not found.");
        if (Number(customer.balance) > 0 || Number(customer.salesCount) > 0) {
          throw new ApiError(409, "This customer has a balance or sales history and cannot be deleted.");
        }
      }
      const result = await pool.request()
        .input("id", sql.UniqueIdentifier, req.params.id)
        .query(`DELETE FROM ${config.table} WHERE id = @id; SELECT @@ROWCOUNT AS affected`);
      if (!result.recordset[0]?.affected) throw new ApiError(404, "Record not found.");
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
}

app.get("/api/health", async (req, res, next) => {
  try {
    await req.app.locals.pool.request().query("SELECT 1 AS connected");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/workspace", async (req, res, next) => {
  try {
    res.json(await loadWorkspace(req.app.locals.pool));
  } catch (error) {
    next(error);
  }
});

app.post("/api/sales", async (req, res, next) => {
  const pool = req.app.locals.pool;
  const transaction = new sql.Transaction(pool);
  let transactionStarted = false;
  try {
    const body = objectBody(req.body);
    const quantity = numeric(body, "quantity");
    const unitPrice = numeric(body, "unitPrice");
    const productName = requiredText(body, "product", 120);
    const customerName = requiredText(body, "customer", 160);
    const payment = requiredText(body, "payment", 30);
    const date = dateValue(body, "date");
    if (!["Cash", "Card", "Bank transfer", "Account"].includes(payment)) throw new ApiError(400, "Unsupported payment method.");
    await transaction.begin();
    transactionStarted = true;
    const productResult = await new sql.Request(transaction)
      .input("name", sql.NVarChar(120), productName)
      .query("SELECT id, stock FROM dbo.FuelProducts WITH (UPDLOCK, ROWLOCK) WHERE name = @name");
    const product = productResult.recordset[0];
    if (!product) throw new ApiError(404, "The selected fuel product was not found.");
    if (Number(product.stock) < quantity) throw new ApiError(409, `Only ${product.stock} units of ${productName} are available.`);
    const customerResult = await new sql.Request(transaction)
      .input("name", sql.NVarChar(160), customerName)
      .query("SELECT id FROM dbo.Customers WITH (UPDLOCK, ROWLOCK) WHERE name = @name");
    const customer = customerResult.recordset[0];
    if (!customer) throw new ApiError(404, "The selected customer was not found.");

    const updateResult = await new sql.Request(transaction)
      .input("id", sql.UniqueIdentifier, product.id)
      .input("quantity", sql.Decimal(18, 3), quantity)
      .query("UPDATE dbo.FuelProducts SET stock = stock - @quantity WHERE id = @id AND stock >= @quantity");
    if (!updateResult.rowsAffected[0]) throw new ApiError(409, "There is not enough fuel in stock.");

    const total = Math.round(quantity * unitPrice * 100) / 100;
    if (total <= 0) throw new ApiError(400, "Sale total must be greater than zero.");
    const saleNumber = `S-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
    const status = payment === "Account" ? "Due" : "Paid";
    const inserted = await new sql.Request(transaction)
      .input("saleNumber", sql.NVarChar(32), saleNumber)
      .input("date", sql.Date, date)
      .input("customerId", sql.UniqueIdentifier, customer.id)
      .input("productId", sql.UniqueIdentifier, product.id)
      .input("quantity", sql.Decimal(18, 3), quantity)
      .input("unitPrice", sql.Decimal(12, 4), unitPrice)
      .input("total", sql.Decimal(18, 2), total)
      .input("payment", sql.NVarChar(30), payment)
      .input("status", sql.NVarChar(20), status)
      .query(`INSERT INTO dbo.Sales (sale_number, sale_date, customer_id, product_id, quantity, unit_price, total, payment, status)
        OUTPUT CONVERT(varchar(36), inserted.id) AS id
        VALUES (@saleNumber, @date, @customerId, @productId, @quantity, @unitPrice, @total, @payment, @status)`);
    if (status === "Due") {
      await new sql.Request(transaction)
        .input("id", sql.UniqueIdentifier, customer.id)
        .input("total", sql.Decimal(18, 2), total)
        .query("UPDATE dbo.Customers SET balance = balance + @total WHERE id = @id");
    }
    await transaction.commit();
    transactionStarted = false;
    res.status(201).json(await getRecord(pool, "sales", inserted.recordset[0].id));
  } catch (error) {
    if (transactionStarted) await rollbackTransaction(transaction);
    next(error);
  }
});

app.post("/api/purchases", async (req, res, next) => {
  const pool = req.app.locals.pool;
  const transaction = new sql.Transaction(pool);
  let transactionStarted = false;
  try {
    const body = objectBody(req.body);
    const quantity = numeric(body, "quantity");
    const unitCost = numeric(body, "unitCost");
    const productName = requiredText(body, "product", 120);
    const supplier = requiredText(body, "supplier", 160);
    const date = dateValue(body, "date");
    await transaction.begin();
    transactionStarted = true;
    const productResult = await new sql.Request(transaction)
      .input("name", sql.NVarChar(120), productName)
      .query("SELECT id, stock, capacity FROM dbo.FuelProducts WITH (UPDLOCK, ROWLOCK) WHERE name = @name");
    const product = productResult.recordset[0];
    if (!product) throw new ApiError(404, "The selected fuel product was not found.");
    if (Number(product.stock) + quantity > Number(product.capacity)) {
      throw new ApiError(409, `The delivery exceeds the remaining capacity of ${productName}.`);
    }
    const total = Math.round(quantity * unitCost * 100) / 100;
    if (total <= 0) throw new ApiError(400, "Purchase total must be greater than zero.");
    const updateResult = await new sql.Request(transaction)
      .input("id", sql.UniqueIdentifier, product.id)
      .input("quantity", sql.Decimal(18, 3), quantity)
      .query("UPDATE dbo.FuelProducts SET stock = stock + @quantity WHERE id = @id AND stock + @quantity <= capacity");
    if (!updateResult.rowsAffected[0]) throw new ApiError(409, "The delivery exceeds the remaining tank capacity.");
    const purchaseNumber = `PO-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
    const inserted = await new sql.Request(transaction)
      .input("purchaseNumber", sql.NVarChar(32), purchaseNumber)
      .input("date", sql.Date, date)
      .input("supplier", sql.NVarChar(160), supplier)
      .input("productId", sql.UniqueIdentifier, product.id)
      .input("quantity", sql.Decimal(18, 3), quantity)
      .input("unitCost", sql.Decimal(12, 4), unitCost)
      .input("total", sql.Decimal(18, 2), total)
      .query(`INSERT INTO dbo.Purchases (purchase_number, delivery_date, supplier, product_id, quantity, unit_cost, total, status)
        OUTPUT CONVERT(varchar(36), inserted.id) AS id
        VALUES (@purchaseNumber, @date, @supplier, @productId, @quantity, @unitCost, @total, N'Received')`);
    await transaction.commit();
    transactionStarted = false;
    res.status(201).json(await getRecord(pool, "purchases", inserted.recordset[0].id));
  } catch (error) {
    if (transactionStarted) await rollbackTransaction(transaction);
    next(error);
  }
});

app.delete("/api/sales/:id", async (req, res, next) => {
  const pool = req.app.locals.pool;
  const transaction = new sql.Transaction(pool);
  let transactionStarted = false;
  try {
    assertId(req.params.id);
    await transaction.begin();
    transactionStarted = true;
    const result = await new sql.Request(transaction)
      .input("id", sql.UniqueIdentifier, req.params.id)
      .query(`SELECT customer_id AS customerId, product_id AS productId, quantity, total, status
        FROM dbo.Sales WITH (UPDLOCK, ROWLOCK) WHERE id = @id`);
    const sale = result.recordset[0];
    if (!sale) throw new ApiError(404, "Record not found.");
    const stockUpdate = await new sql.Request(transaction)
      .input("id", sql.UniqueIdentifier, sale.productId)
      .input("quantity", sql.Decimal(18, 3), sale.quantity)
      .query("UPDATE dbo.FuelProducts SET stock = stock + @quantity WHERE id = @id AND stock + @quantity <= capacity");
    if (!stockUpdate.rowsAffected[0]) throw new ApiError(409, "The sale cannot be reversed because the tank would exceed its capacity.");
    if (sale.status === "Due") {
      const customerBalance = await new sql.Request(transaction)
        .input("id", sql.UniqueIdentifier, sale.customerId)
        .query("SELECT balance FROM dbo.Customers WITH (UPDLOCK, ROWLOCK) WHERE id = @id");
      if (Number(customerBalance.recordset[0]?.balance || 0) < Number(sale.total)) {
        throw new ApiError(409, "The customer balance is below this sale total; adjust the balance before deleting the sale.");
      }
      await new sql.Request(transaction)
        .input("id", sql.UniqueIdentifier, sale.customerId)
        .input("total", sql.Decimal(18, 2), sale.total)
        .query("UPDATE dbo.Customers SET balance = balance - @total WHERE id = @id");
    }
    await new sql.Request(transaction)
      .input("id", sql.UniqueIdentifier, req.params.id)
      .query("DELETE FROM dbo.Sales WHERE id = @id");
    await transaction.commit();
    transactionStarted = false;
    res.status(204).end();
  } catch (error) {
    if (transactionStarted) await rollbackTransaction(transaction);
    next(error);
  }
});

app.delete("/api/purchases/:id", async (req, res, next) => {
  const pool = req.app.locals.pool;
  const transaction = new sql.Transaction(pool);
  let transactionStarted = false;
  try {
    assertId(req.params.id);
    await transaction.begin();
    transactionStarted = true;
    const result = await new sql.Request(transaction)
      .input("id", sql.UniqueIdentifier, req.params.id)
      .query("SELECT product_id AS productId, quantity FROM dbo.Purchases WITH (UPDLOCK, ROWLOCK) WHERE id = @id");
    const purchase = result.recordset[0];
    if (!purchase) throw new ApiError(404, "Record not found.");
    const update = await new sql.Request(transaction)
      .input("id", sql.UniqueIdentifier, purchase.productId)
      .input("quantity", sql.Decimal(18, 3), purchase.quantity)
      .query("UPDATE dbo.FuelProducts SET stock = stock - @quantity WHERE id = @id AND stock >= @quantity");
    if (!update.rowsAffected[0]) throw new ApiError(409, "This delivery cannot be removed because some fuel has already been sold or adjusted.");
    await new sql.Request(transaction)
      .input("id", sql.UniqueIdentifier, req.params.id)
      .query("DELETE FROM dbo.Purchases WHERE id = @id");
    await transaction.commit();
    transactionStarted = false;
    res.status(204).end();
  } catch (error) {
    if (transactionStarted) await rollbackTransaction(transaction);
    next(error);
  }
});

for (const [collection, config] of Object.entries(collections)) addBasicRoutes(collection, config);

app.use("/api", (req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.use(express.static(frontendRoot));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
  if (error.type === "entity.parse.failed") return res.status(400).json({ error: "Request body contains invalid JSON." });
  if (error.type === "entity.too.large") return res.status(413).json({ error: "Request body is too large." });
  if (error.number === 2627 || error.number === 2601) return res.status(409).json({ error: "A record with that name or number already exists." });
  if (error.number === 547) return res.status(409).json({ error: "This record is linked to existing transaction history and cannot be deleted." });
  if (error.number === 8169) return res.status(400).json({ error: "Record ID must be a valid UUID." });
  console.error("FuelFlow API error:", error);
  return res.status(500).json({ error: "The server could not complete the request." });
});

async function start() {
  const pool = await createPool();
  app.locals.pool = pool;
  const server = app.listen(port, host, () => console.log(`FuelFlow is available at http://${host}:${port}`));
  const close = async () => {
    server.close(async () => {
      await pool.close();
      process.exit(0);
    });
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}

if (require.main === module) {
  start().catch((error) => {
    console.error("FuelFlow could not connect to Microsoft SQL Server:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, start, loadWorkspace };
