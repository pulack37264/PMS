require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const sql = require("mssql");
const { createPool, sqlOptions } = require("./sql");

const products = [
  ["10000000-0000-4000-8000-000000000001", "Diesel", "Diesel", "L", 18450, 30000, 5000, 1.12, 1.38, "NorthStar Petroleum"],
  ["10000000-0000-4000-8000-000000000002", "Regular Unleaded", "Gasoline", "L", 12780, 25000, 4500, 1.04, 1.29, "Atlas Energy Co."],
  ["10000000-0000-4000-8000-000000000003", "Premium Unleaded", "Gasoline", "L", 6920, 12000, 2500, 1.18, 1.46, "Atlas Energy Co."],
  ["10000000-0000-4000-8000-000000000004", "Kerosene", "Kerosene", "L", 2180, 8000, 2500, 0.94, 1.17, "NorthStar Petroleum"],
];

const customers = [
  ["20000000-0000-4000-8000-000000000001", "Harbor Logistics", "+1 (555) 014-2280", "accounts@harborlogistics.com", 2480.5, "Active"],
  ["20000000-0000-4000-8000-000000000002", "Cityline Transport", "+1 (555) 014-3901", "billing@cityline.co", 0, "Active"],
  ["20000000-0000-4000-8000-000000000003", "Pioneer Construction", "+1 (555) 014-6622", "finance@pioneerbuild.com", 735.2, "Active"],
  ["20000000-0000-4000-8000-000000000004", "Walk-in customer", "—", "—", 0, "Active"],
];

const dateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

async function seedDatabase(pool) {
  const existing = await pool.request().query("SELECT COUNT_BIG(*) AS count FROM dbo.FuelProducts");
  if (Number(existing.recordset[0].count) > 0) return;

  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    for (const [id, name, type, unit, stock, capacity, reorderLevel, costPrice, sellPrice, supplier] of products) {
      await new sql.Request(transaction)
        .input("id", sql.UniqueIdentifier, id)
        .input("name", sql.NVarChar(120), name)
        .input("type", sql.NVarChar(40), type)
        .input("unit", sql.NVarChar(8), unit)
        .input("stock", sql.Decimal(18, 3), stock)
        .input("capacity", sql.Decimal(18, 3), capacity)
        .input("reorderLevel", sql.Decimal(18, 3), reorderLevel)
        .input("costPrice", sql.Decimal(12, 4), costPrice)
        .input("sellPrice", sql.Decimal(12, 4), sellPrice)
        .input("supplier", sql.NVarChar(160), supplier)
        .query(`INSERT INTO dbo.FuelProducts (id, name, type, unit, stock, capacity, reorder_level, cost_price, sell_price, supplier)
          VALUES (@id, @name, @type, @unit, @stock, @capacity, @reorderLevel, @costPrice, @sellPrice, @supplier)`);
    }

    for (const [id, name, phone, email, balance, status] of customers) {
      await new sql.Request(transaction)
        .input("id", sql.UniqueIdentifier, id)
        .input("name", sql.NVarChar(160), name)
        .input("phone", sql.NVarChar(40), phone)
        .input("email", sql.NVarChar(254), email)
        .input("balance", sql.Decimal(18, 2), balance)
        .input("status", sql.NVarChar(30), status)
        .query("INSERT INTO dbo.Customers (id, name, phone, email, balance, status) VALUES (@id, @name, @phone, @email, @balance, @status)");
    }

    const sales = [
      ["sale-1008", 0, 4, 1, 860, 1.38, "Card", "Paid"],
      ["sale-1007", 0, 1, 2, 420, 1.29, "Account", "Due"],
      ["sale-1006", 1, 4, 3, 310, 1.46, "Cash", "Paid"],
      ["sale-1005", 2, 2, 1, 1240, 1.38, "Account", "Paid"],
      ["sale-1004", 3, 4, 2, 690, 1.29, "Card", "Paid"],
    ];
    for (const [saleNumber, days, customer, product, quantity, unitPrice, payment, status] of sales) {
      await new sql.Request(transaction)
        .input("saleNumber", sql.NVarChar(32), saleNumber)
        .input("date", sql.Date, dateOffset(days))
        .input("customerId", sql.UniqueIdentifier, customers[customer - 1][0])
        .input("productId", sql.UniqueIdentifier, products[product - 1][0])
        .input("quantity", sql.Decimal(18, 3), quantity)
        .input("unitPrice", sql.Decimal(12, 4), unitPrice)
        .input("total", sql.Decimal(18, 2), Math.round(quantity * unitPrice * 100) / 100)
        .input("payment", sql.NVarChar(30), payment)
        .input("status", sql.NVarChar(20), status)
        .query(`INSERT INTO dbo.Sales (sale_number, sale_date, customer_id, product_id, quantity, unit_price, total, payment, status)
          VALUES (@saleNumber, @date, @customerId, @productId, @quantity, @unitPrice, @total, @payment, @status)`);
    }

    const purchases = [
      ["po-2081", 1, "NorthStar Petroleum", 1, 12000, 1.12],
      ["po-2080", 4, "Atlas Energy Co.", 2, 9000, 1.04],
      ["po-2079", 6, "NorthStar Petroleum", 4, 5000, 0.94],
    ];
    for (const [purchaseNumber, days, supplier, product, quantity, unitCost] of purchases) {
      await new sql.Request(transaction)
        .input("purchaseNumber", sql.NVarChar(32), purchaseNumber)
        .input("date", sql.Date, dateOffset(days))
        .input("supplier", sql.NVarChar(160), supplier)
        .input("productId", sql.UniqueIdentifier, products[product - 1][0])
        .input("quantity", sql.Decimal(18, 3), quantity)
        .input("unitCost", sql.Decimal(12, 4), unitCost)
        .input("total", sql.Decimal(18, 2), Math.round(quantity * unitCost * 100) / 100)
        .query(`INSERT INTO dbo.Purchases (purchase_number, delivery_date, supplier, product_id, quantity, unit_cost, total, status)
          VALUES (@purchaseNumber, @date, @supplier, @productId, @quantity, @unitCost, @total, N'Received')`);
    }

    const expenses = [
      [0, "Utilities", "Electricity and water", 284.5, "Bank transfer"],
      [1, "Maintenance", "Pump servicing", 460, "Card"],
      [3, "Transport", "Delivery vehicle fuel", 175.2, "Cash"],
    ];
    for (const [days, category, description, amount, paymentMethod] of expenses) {
      await new sql.Request(transaction)
        .input("date", sql.Date, dateOffset(days))
        .input("category", sql.NVarChar(50), category)
        .input("description", sql.NVarChar(240), description)
        .input("amount", sql.Decimal(18, 2), amount)
        .input("paymentMethod", sql.NVarChar(40), paymentMethod)
        .query(`INSERT INTO dbo.Expenses (expense_date, category, description, amount, payment_method)
          VALUES (@date, @category, @description, @amount, @paymentMethod)`);
    }

    const staff = [
      ["Jordan Lee", "Station manager", "+1 (555) 014-1012", "Morning", "Active"],
      ["Sam Rivera", "Fuel attendant", "+1 (555) 014-7634", "Afternoon", "Active"],
      ["Taylor Brooks", "Cashier", "+1 (555) 014-8521", "Night", "Active"],
      ["Casey Morgan", "Fuel attendant", "+1 (555) 014-4467", "Morning", "On leave"],
    ];
    for (const [name, role, phone, shift, status] of staff) {
      await new sql.Request(transaction)
        .input("name", sql.NVarChar(120), name)
        .input("role", sql.NVarChar(80), role)
        .input("phone", sql.NVarChar(40), phone)
        .input("shift", sql.NVarChar(30), shift)
        .input("status", sql.NVarChar(30), status)
        .query("INSERT INTO dbo.Staff (name, role, phone, shift, status) VALUES (@name, @role, @phone, @shift, @status)");
    }

    await transaction.commit();
    console.log("FuelFlow sample records inserted.");
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function main() {
  const pool = await createPool();
  try {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await pool.request().batch(schema);
    await seedDatabase(pool);
    console.log(`FuelFlow schema is ready in database "${process.env.DB_NAME}".`);
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error("Database initialization failed:", error.message);
  process.exitCode = 1;
});
