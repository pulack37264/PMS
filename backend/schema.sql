IF OBJECT_ID(N'dbo.Staff', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Staff (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Staff_id DEFAULT NEWID() PRIMARY KEY,
    name NVARCHAR(120) NOT NULL,
    role NVARCHAR(80) NOT NULL,
    phone NVARCHAR(40) NOT NULL,
    shift NVARCHAR(30) NOT NULL,
    status NVARCHAR(30) NOT NULL
  );
END;

IF OBJECT_ID(N'dbo.Expenses', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Expenses (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Expenses_id DEFAULT NEWID() PRIMARY KEY,
    expense_date DATE NOT NULL,
    category NVARCHAR(50) NOT NULL,
    description NVARCHAR(240) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL CONSTRAINT CK_Expenses_amount CHECK (amount > 0),
    payment_method NVARCHAR(40) NOT NULL
  );
END;

IF OBJECT_ID(N'dbo.Customers', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Customers (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Customers_id DEFAULT NEWID() PRIMARY KEY,
    name NVARCHAR(160) NOT NULL CONSTRAINT UQ_Customers_name UNIQUE,
    phone NVARCHAR(40) NOT NULL,
    email NVARCHAR(254) NOT NULL,
    balance DECIMAL(18, 2) NOT NULL CONSTRAINT DF_Customers_balance DEFAULT 0
      CONSTRAINT CK_Customers_balance CHECK (balance >= 0),
    status NVARCHAR(30) NOT NULL
  );
END;

IF OBJECT_ID(N'dbo.FuelProducts', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.FuelProducts (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_FuelProducts_id DEFAULT NEWID() PRIMARY KEY,
    name NVARCHAR(120) NOT NULL CONSTRAINT UQ_FuelProducts_name UNIQUE,
    type NVARCHAR(40) NOT NULL,
    unit NVARCHAR(8) NOT NULL,
    stock DECIMAL(18, 3) NOT NULL CONSTRAINT CK_FuelProducts_stock CHECK (stock >= 0),
    capacity DECIMAL(18, 3) NOT NULL CONSTRAINT CK_FuelProducts_capacity CHECK (capacity > 0),
    reorder_level DECIMAL(18, 3) NOT NULL CONSTRAINT CK_FuelProducts_reorder CHECK (reorder_level >= 0),
    cost_price DECIMAL(12, 4) NOT NULL CONSTRAINT CK_FuelProducts_cost CHECK (cost_price >= 0),
    sell_price DECIMAL(12, 4) NOT NULL CONSTRAINT CK_FuelProducts_sell CHECK (sell_price > 0),
    supplier NVARCHAR(160) NOT NULL
  );
END;

IF OBJECT_ID(N'dbo.Sales', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Sales (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Sales_id DEFAULT NEWID() PRIMARY KEY,
    sale_number NVARCHAR(32) NOT NULL CONSTRAINT UQ_Sales_sale_number UNIQUE,
    sale_date DATE NOT NULL,
    customer_id UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    quantity DECIMAL(18, 3) NOT NULL CONSTRAINT CK_Sales_quantity CHECK (quantity > 0),
    unit_price DECIMAL(12, 4) NOT NULL CONSTRAINT CK_Sales_unit_price CHECK (unit_price > 0),
    total DECIMAL(18, 2) NOT NULL CONSTRAINT CK_Sales_total CHECK (total > 0),
    payment NVARCHAR(30) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    CONSTRAINT FK_Sales_Customers FOREIGN KEY (customer_id) REFERENCES dbo.Customers(id),
    CONSTRAINT FK_Sales_FuelProducts FOREIGN KEY (product_id) REFERENCES dbo.FuelProducts(id)
  );
END;

IF OBJECT_ID(N'dbo.Purchases', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Purchases (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Purchases_id DEFAULT NEWID() PRIMARY KEY,
    purchase_number NVARCHAR(32) NOT NULL CONSTRAINT UQ_Purchases_purchase_number UNIQUE,
    delivery_date DATE NOT NULL,
    supplier NVARCHAR(160) NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    quantity DECIMAL(18, 3) NOT NULL CONSTRAINT CK_Purchases_quantity CHECK (quantity > 0),
    unit_cost DECIMAL(12, 4) NOT NULL CONSTRAINT CK_Purchases_unit_cost CHECK (unit_cost > 0),
    total DECIMAL(18, 2) NOT NULL CONSTRAINT CK_Purchases_total CHECK (total > 0),
    status NVARCHAR(20) NOT NULL,
    CONSTRAINT FK_Purchases_FuelProducts FOREIGN KEY (product_id) REFERENCES dbo.FuelProducts(id)
  );
END;
