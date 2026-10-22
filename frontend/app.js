const today = new Date();
const dateOffset = (days) => {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const seedData = {
  inventory: [
    { id: "fuel-1", name: "Diesel", type: "Diesel", unit: "L", stock: 18450, capacity: 30000, reorderLevel: 5000, costPrice: 1.12, sellPrice: 1.38, supplier: "NorthStar Petroleum" },
    { id: "fuel-2", name: "Regular Unleaded", type: "Gasoline", unit: "L", stock: 12780, capacity: 25000, reorderLevel: 4500, costPrice: 1.04, sellPrice: 1.29, supplier: "Atlas Energy Co." },
    { id: "fuel-3", name: "Premium Unleaded", type: "Gasoline", unit: "L", stock: 6920, capacity: 12000, reorderLevel: 2500, costPrice: 1.18, sellPrice: 1.46, supplier: "Atlas Energy Co." },
    { id: "fuel-4", name: "Kerosene", type: "Kerosene", unit: "L", stock: 2180, capacity: 8000, reorderLevel: 2500, costPrice: 0.94, sellPrice: 1.17, supplier: "NorthStar Petroleum" },
  ],
  sales: [
    { id: "sale-1008", date: dateOffset(0), customer: "Walk-in customer", product: "Diesel", quantity: 860, unitPrice: 1.38, total: 1186.8, payment: "Card", status: "Paid" },
    { id: "sale-1007", date: dateOffset(0), customer: "Harbor Logistics", product: "Regular Unleaded", quantity: 420, unitPrice: 1.29, total: 541.8, payment: "Account", status: "Due" },
    { id: "sale-1006", date: dateOffset(1), customer: "Walk-in customer", product: "Premium Unleaded", quantity: 310, unitPrice: 1.46, total: 452.6, payment: "Cash", status: "Paid" },
    { id: "sale-1005", date: dateOffset(2), customer: "Cityline Transport", product: "Diesel", quantity: 1240, unitPrice: 1.38, total: 1711.2, payment: "Account", status: "Paid" },
    { id: "sale-1004", date: dateOffset(3), customer: "Walk-in customer", product: "Regular Unleaded", quantity: 690, unitPrice: 1.29, total: 890.1, payment: "Card", status: "Paid" },
  ],
  customers: [
    { id: "cust-1", name: "Harbor Logistics", phone: "+1 (555) 014-2280", email: "accounts@harborlogistics.com", balance: 2480.5, status: "Active" },
    { id: "cust-2", name: "Cityline Transport", phone: "+1 (555) 014-3901", email: "billing@cityline.co", balance: 0, status: "Active" },
    { id: "cust-3", name: "Pioneer Construction", phone: "+1 (555) 014-6622", email: "finance@pioneerbuild.com", balance: 735.2, status: "Active" },
    { id: "cust-4", name: "Walk-in customer", phone: "—", email: "—", balance: 0, status: "Active" },
  ],
  purchases: [
    { id: "po-2081", date: dateOffset(1), supplier: "NorthStar Petroleum", product: "Diesel", quantity: 12000, unitCost: 1.12, total: 13440, status: "Received" },
    { id: "po-2080", date: dateOffset(4), supplier: "Atlas Energy Co.", product: "Regular Unleaded", quantity: 9000, unitCost: 1.04, total: 9360, status: "Received" },
    { id: "po-2079", date: dateOffset(6), supplier: "NorthStar Petroleum", product: "Kerosene", quantity: 5000, unitCost: 0.94, total: 4700, status: "Received" },
  ],
  expenses: [
    { id: "exp-301", date: dateOffset(0), category: "Utilities", description: "Electricity and water", amount: 284.5, paymentMethod: "Bank transfer" },
    { id: "exp-300", date: dateOffset(1), category: "Maintenance", description: "Pump servicing", amount: 460, paymentMethod: "Card" },
    { id: "exp-299", date: dateOffset(3), category: "Transport", description: "Delivery vehicle fuel", amount: 175.2, paymentMethod: "Cash" },
  ],
  staff: [
    { id: "staff-1", name: "Jordan Lee", role: "Station manager", phone: "+1 (555) 014-1012", shift: "Morning", status: "Active" },
    { id: "staff-2", name: "Sam Rivera", role: "Fuel attendant", phone: "+1 (555) 014-7634", shift: "Afternoon", status: "Active" },
    { id: "staff-3", name: "Taylor Brooks", role: "Cashier", phone: "+1 (555) 014-8521", shift: "Night", status: "Active" },
    { id: "staff-4", name: "Casey Morgan", role: "Fuel attendant", phone: "+1 (555) 014-4467", shift: "Morning", status: "On leave" },
  ],
};

const definitions = {
  inventory: {
    title: "Fuel inventory", singular: "fuel product", subtitle: "Monitor tank levels, pricing and reorder points.", action: "Add fuel",
    columns: [["name", "Product"], ["type", "Fuel type"], ["stock", "Available stock"], ["capacity", "Tank capacity"], ["sellPrice", "Sell price"], ["supplier", "Supplier"]],
    fields: [
      ["name", "Product name", "text", true], ["type", "Fuel type", "select", true, ["Diesel", "Gasoline", "Kerosene", "LPG", "Other"]],
      ["unit", "Stock unit", "select", true, ["L", "gal", "kg"]], ["stock", "Current stock", "number", true],
      ["capacity", "Tank capacity", "number", true], ["reorderLevel", "Reorder level", "number", true],
      ["costPrice", "Cost per unit", "number", true], ["sellPrice", "Sell price per unit", "number", true],
      ["supplier", "Preferred supplier", "text", false],
    ],
  },
  sales: {
    title: "Sales", singular: "sale", subtitle: "Track fuel sales, payment methods and customer accounts.", action: "Record sale", immutable: true,
    columns: [["saleNumber", "Sale ID"], ["date", "Date"], ["customer", "Customer"], ["product", "Fuel"], ["quantity", "Quantity"], ["total", "Total"], ["status", "Payment"]],
    fields: [["product", "Fuel product", "inventory", true], ["customer", "Customer", "customer", true], ["quantity", "Quantity", "number", true], ["unitPrice", "Price per unit", "number", true], ["payment", "Payment method", "select", true, ["Cash", "Card", "Bank transfer", "Account"]], ["date", "Sale date", "date", true]],
  },
  customers: {
    title: "Customers", singular: "customer", subtitle: "Manage customer contacts and outstanding account balances.", action: "Add customer",
    columns: [["name", "Customer"], ["phone", "Phone"], ["email", "Email"], ["balance", "Outstanding balance"], ["status", "Status"]],
    fields: [["name", "Customer name", "text", true], ["phone", "Phone", "tel", true], ["email", "Email", "email", false], ["balance", "Opening balance", "number", false], ["status", "Status", "select", true, ["Active", "Inactive"]]],
  },
  purchases: {
    title: "Purchases", singular: "purchase", subtitle: "Receive fuel deliveries and keep inventory up to date.", action: "Record delivery", immutable: true,
    columns: [["purchaseNumber", "Purchase ID"], ["date", "Date"], ["supplier", "Supplier"], ["product", "Fuel"], ["quantity", "Quantity"], ["total", "Total"], ["status", "Status"]],
    fields: [["product", "Fuel product", "inventory", true], ["supplier", "Supplier", "text", true], ["quantity", "Quantity received", "number", true], ["unitCost", "Cost per unit", "number", true], ["date", "Delivery date", "date", true]],
  },
  expenses: {
    title: "Expenses", singular: "expense", subtitle: "Keep operating costs organized and visible.", action: "Add expense",
    columns: [["id", "Expense ID"], ["date", "Date"], ["category", "Category"], ["description", "Description"], ["paymentMethod", "Payment method"], ["amount", "Amount"]],
    fields: [["category", "Category", "select", true, ["Utilities", "Maintenance", "Transport", "Payroll", "Rent", "Other"]], ["description", "Description", "text", true], ["amount", "Amount", "number", true], ["paymentMethod", "Payment method", "select", true, ["Cash", "Card", "Bank transfer"]], ["date", "Expense date", "date", true]],
  },
  staff: {
    title: "Staff", singular: "staff member", subtitle: "Manage your team and shift assignments.", action: "Add staff member",
    columns: [["name", "Team member"], ["role", "Role"], ["phone", "Phone"], ["shift", "Shift"], ["status", "Status"]],
    fields: [["name", "Full name", "text", true], ["role", "Role", "select", true, ["Station manager", "Fuel attendant", "Cashier", "Accountant", "Other"]], ["phone", "Phone", "tel", true], ["shift", "Shift", "select", true, ["Morning", "Afternoon", "Night", "Flexible"]], ["status", "Status", "select", true, ["Active", "On leave", "Inactive"]]],
  },
};

let data = { inventory: [], sales: [], customers: [], purchases: [], expenses: [], staff: [] };
let activeView = "dashboard";
let editingId = null;
let toastTimer;

const content = document.querySelector("#content");
const modal = document.querySelector("#modal-backdrop");
const form = document.querySelector("#record-form");
const fieldContainer = document.querySelector("#form-fields");
const money = (amount) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount) || 0);
const number = (amount) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(amount) || 0);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const api = async (endpoint, options = {}) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = await response.json();
      message = body.error || message;
    } catch (error) {
      console.error("Could not read the server error response.", error);
    }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
};

async function refreshData() {
  data = await api("/api/workspace");
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function statusMarkup(value) {
  const key = String(value || "").toLowerCase();
  const variant = key === "due" || key === "on leave" ? "warning" : ["inactive", "overdue"].includes(key) ? "danger" : key === "pending" ? "neutral" : "";
  return `<span class="status ${variant}">${escapeHtml(value || "—")}</span>`;
}

function fieldValue(view, record, field) {
  const value = record[field];
  if (value === undefined || value === null || value === "") return "—";
  if (["total", "amount", "balance", "sellPrice", "costPrice", "unitPrice", "unitCost"].includes(field)) return money(value);
  if (field === "quantity" || field === "stock" || field === "capacity" || field === "reorderLevel") {
    const product = view === "inventory" ? record : data.inventory.find((item) => item.name === record.product);
    return `${number(value)}${product ? ` ${escapeHtml(product.unit)}` : ""}`;
  }
  if (field === "date") return formatDate(value);
  if (field === "status") return statusMarkup(value);
  return escapeHtml(value);
}

function renderDashboard() {
  const todaySales = data.sales.filter((sale) => sale.date === dateOffset(0));
  const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const lowStock = data.inventory.filter((product) => Number(product.stock) <= Number(product.reorderLevel));
  const outstanding = data.customers.reduce((sum, customer) => sum + Number(customer.balance || 0), 0);
  const stockValue = data.inventory.reduce((sum, product) => sum + Number(product.stock) * Number(product.costPrice), 0);
  const weekdayLabels = [];
  const salesBars = [];
  for (let index = 6; index >= 0; index--) {
    const day = new Date(today);
    day.setDate(day.getDate() - index);
    const date = day.toISOString().slice(0, 10);
    weekdayLabels.push(new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day));
    salesBars.push(data.sales.filter((sale) => sale.date === date).reduce((sum, sale) => sum + Number(sale.total), 0));
  }
  const maxBar = Math.max(...salesBars, 1);
  const bars = salesBars.map((amount) => `<div class="bar-group"><i class="bar primary" style="height:${Math.max(4, amount / maxBar * 100)}%"></i></div>`).join("");
  const stockMarkup = data.inventory.slice(0, 4).map((product) => {
    const percent = Math.min(100, Number(product.stock) / Math.max(1, Number(product.capacity)) * 100);
    const low = Number(product.stock) <= Number(product.reorderLevel);
    return `<div><div class="stock-item-top"><span class="stock-name">${escapeHtml(product.name)}</span><span class="stock-amount">${number(product.stock)} ${escapeHtml(product.unit)}</span></div><div class="progress-track"><div class="progress-fill ${low ? "low" : ""}" style="width:${percent}%"></div></div><div class="stock-note">${low ? "Reorder required" : `${Math.round(percent)}% of tank capacity`}</div></div>`;
  }).join("");
  const recent = [...data.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const rows = recent.map((sale) => `<tr><td><span class="primary-cell">${escapeHtml(sale.saleNumber)}</span><span class="secondary-cell">${formatDate(sale.date)}</span></td><td>${escapeHtml(sale.customer)}</td><td>${escapeHtml(sale.product)}</td><td>${money(sale.total)}</td><td>${statusMarkup(sale.status)}</td></tr>`).join("");
  return `
    <div class="page-heading"><div><div class="eyebrow">${new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(today).toUpperCase()}</div><h1>Good day, Alex <span aria-hidden="true">✦</span></h1><p>Here's what's happening across your fuel operations.</p></div><button class="button button-primary" data-action="new-sale">＋ Record a sale</button></div>
    ${lowStock.length ? `<div class="alert-banner"><strong>⚠</strong> ${lowStock.length} fuel ${lowStock.length === 1 ? "product is" : "products are"} at or below its reorder level. <button class="text-button" data-view-link="inventory">Review inventory →</button></div>` : ""}
    <section class="metrics">
      <article class="metric-card"><div class="metric-top">Today's revenue <span class="metric-icon">↗</span></div><div class="metric-value">${money(todayRevenue)}</div><div class="metric-foot"><span class="positive">${todaySales.length} sales</span> recorded today</div></article>
      <article class="metric-card"><div class="metric-top">Inventory on hand <span class="metric-icon blue">▤</span></div><div class="metric-value">${new Set(data.inventory.map((item) => item.unit)).size > 1 ? "Multiple units" : `${number(data.inventory.reduce((sum, item) => sum + Number(item.stock), 0))} ${escapeHtml(data.inventory[0]?.unit || "L")}`}</div><div class="metric-foot">${data.inventory.length} fuel products tracked</div></article>
      <article class="metric-card"><div class="metric-top">Low stock alerts <span class="metric-icon amber">!</span></div><div class="metric-value">${lowStock.length}</div><div class="metric-foot"><span class="${lowStock.length ? "warning" : "positive"}">${lowStock.length ? "Needs attention" : "All levels healthy"}</span></div></article>
      <article class="metric-card"><div class="metric-top">Customer balance <span class="metric-icon">◉</span></div><div class="metric-value">${money(outstanding)}</div><div class="metric-foot">${data.customers.length} customer accounts · stock value ${money(stockValue)}</div></article>
    </section>
    <section class="dashboard-grid">
      <article class="panel"><div class="panel-header"><div><h2 class="panel-title">Sales overview</h2><p class="panel-subtitle">Revenue activity over the last 7 days</p></div><div class="chart-legend"><span class="legend-key"><i></i>Revenue</span></div></div><div class="chart-area">${bars}</div><div class="bar-labels">${weekdayLabels.map((day) => `<span>${day}</span>`).join("")}</div></article>
      <article class="panel"><div class="panel-header"><div><h2 class="panel-title">Fuel levels</h2><p class="panel-subtitle">Current tank capacity</p></div><button class="text-button" data-view-link="inventory">View all →</button></div><div class="stock-list">${stockMarkup || '<div class="empty-state">Add a fuel product to track stock.</div>'}</div></article>
    </section>
    <article class="panel table-panel"><div class="panel-header"><div><h2 class="panel-title">Recent sales</h2><p class="panel-subtitle">Latest recorded transactions</p></div><button class="text-button" data-view-link="sales">View all sales →</button></div><div class="table-wrap"><table><thead><tr><th>Sale</th><th>Customer</th><th>Fuel</th><th>Total</th><th>Payment</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="empty-state">No sales recorded yet.</td></tr>'}</tbody></table></div></article>`;
}

function renderTable(view, query = "") {
  const definition = definitions[view];
  const normalizedQuery = query.trim().toLowerCase();
  const records = data[view].filter((record) => Object.values(record).some((value) => String(value).toLowerCase().includes(normalizedQuery)));
  const headings = definition.columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("");
  const rows = records.map((record) => {
    const cells = definition.columns.map(([key]) => `<td class="${key === "name" || key === "id" ? "primary-cell" : ""}">${fieldValue(view, record, key)}</td>`).join("");
    const actions = `<td class="actions-cell"><span class="row-actions">${definition.immutable ? "" : `<button class="row-action" data-edit="${escapeHtml(record.id)}">Edit</button>`}<button class="row-action delete" data-delete="${escapeHtml(record.id)}">Delete</button></span></td>`;
    return `<tr>${cells}${actions}</tr>`;
  }).join("");
  const lowStockMessage = view === "inventory" && data.inventory.some((item) => Number(item.stock) <= Number(item.reorderLevel)) ? `<div class="alert-banner"><strong>⚠</strong> One or more products are at or below their reorder level.</div>` : "";
  return `
    <div class="page-heading"><div><div class="eyebrow">OPERATIONS</div><h1>${escapeHtml(definition.title)}</h1><p>${escapeHtml(definition.subtitle)}</p></div><button class="button button-primary" data-add>＋ ${escapeHtml(definition.action)}</button></div>
    ${lowStockMessage}
    <div class="toolbar"><label class="search-box"><span>⌕</span><input type="search" id="record-search" placeholder="Search ${escapeHtml(definition.title.toLowerCase())}..." value="${escapeHtml(query)}" aria-label="Search ${escapeHtml(definition.title)}"></label><span class="table-count">${records.length} ${records.length === 1 ? "record" : "records"}</span><button class="button button-quiet" data-export>↓ Export CSV</button></div>
    <article class="panel table-panel"><div class="table-wrap"><table><thead><tr>${headings}<th class="actions-cell">Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="${definition.columns.length + 1}" class="empty-state">${normalizedQuery ? "No matching records found." : `No ${escapeHtml(definition.title.toLowerCase())} yet. Add your first record to get started.`}</td></tr>`}</tbody></table></div></article>`;
}

function render(view = activeView, query = "") {
  activeView = view;
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  const titles = { dashboard: "Overview", ...Object.fromEntries(Object.entries(definitions).map(([key, value]) => [key, value.title])) };
  document.querySelector("#breadcrumb-current").textContent = titles[view];
  document.querySelector("#low-stock-count").textContent = data.inventory.filter((item) => Number(item.stock) <= Number(item.reorderLevel)).length;
  content.innerHTML = view === "dashboard" ? renderDashboard() : renderTable(view, query);
}

function buildField(field, current = {}) {
  const [name, label, type, required, options] = field;
  const selectedProduct = current.product ?? data.inventory[0]?.name;
  const value = current[name] ?? (name === "date" ? dateOffset(0) : name === "unitPrice" && selectedProduct ? data.inventory.find((item) => item.name === selectedProduct)?.sellPrice : name === "unitCost" && selectedProduct ? data.inventory.find((item) => item.name === selectedProduct)?.costPrice : "");
  let control;
  if (type === "select" || type === "inventory" || type === "customer") {
    let values = options || [];
    if (type === "inventory") values = data.inventory.map((item) => item.name);
    if (type === "customer") values = data.customers.map((item) => item.name);
    control = `<select id="field-${name}" name="${name}" ${required ? "required" : ""}>${!required ? '<option value="">Select an option</option>' : ""}${values.map((option) => `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select>`;
  } else {
    const countField = ["stock", "capacity", "reorderLevel"].includes(name);
    const min = type === "number" ? `min="${name === "quantity" ? "1" : countField || name === "balance" ? "0" : "0.01"}" step="${countField || name === "quantity" ? "1" : "0.01"}"` : "";
    control = `<input id="field-${name}" name="${name}" type="${type}" ${type === "number" ? min : ""} ${required ? "required" : ""} value="${escapeHtml(value)}" ${type === "number" ? 'inputmode="decimal"' : ""}>`;
  }
  return `<div class="field"><label for="field-${name}">${escapeHtml(label)}${required ? " *" : ""}</label>${control}</div>`;
}

function openForm(id = null) {
  const definition = definitions[activeView];
  if (!definition || (definition.immutable && id)) return;
  editingId = id;
  const existing = id ? data[activeView].find((record) => record.id === id) : {};
  document.querySelector("#modal-eyebrow").textContent = id ? "UPDATE RECORD" : "NEW RECORD";
  document.querySelector("#modal-title").textContent = id ? `Edit ${definition.singular}` : `Add ${definition.singular}`;
  document.querySelector("#save-button").innerHTML = id ? 'Save changes <span>→</span>' : 'Save record <span>→</span>';
  fieldContainer.innerHTML = definition.fields.map((field) => buildField(field, existing)).join("");
  fieldContainer.querySelector("#field-product")?.addEventListener("change", (event) => {
    const product = data.inventory.find((item) => item.name === event.target.value);
    const priceField = fieldContainer.querySelector(`#field-${activeView === "sales" ? "unitPrice" : "unitCost"}`);
    if (product && priceField) priceField.value = activeView === "sales" ? product.sellPrice : product.costPrice;
  });
  modal.hidden = false;
  modal.querySelector("input, select")?.focus();
}

function closeForm() {
  modal.hidden = true;
  form.reset();
  editingId = null;
}

async function deleteRecord(id) {
  const record = data[activeView].find((item) => item.id === id);
  if (!record || !confirm(`Delete this ${definitions[activeView].singular}? This action cannot be undone.`)) return;
  try {
    await api(`/api/${activeView}/${encodeURIComponent(id)}`, { method: "DELETE" });
    await refreshData();
    render(activeView);
    showToast("Record deleted.");
  } catch (error) {
    showToast(error.message);
  }
}

function exportCsv() {
  const definition = definitions[activeView];
  const keys = definition.columns.map(([key]) => key);
  const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [keys.map((key) => escapeCsv(definition.columns.find(([column]) => column === key)[1])).join(","), ...data[activeView].map((record) => keys.map((key) => escapeCsv(record[key])).join(","))].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = `fuelflow-${activeView}-${dateOffset(0)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

document.querySelector(".main-nav").addEventListener("click", (event) => {
  const item = event.target.closest("[data-view]");
  if (item) {
    document.querySelector("#sidebar").classList.remove("open");
    render(item.dataset.view);
  }
});

content.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.viewLink) render(target.dataset.viewLink);
  if (target.matches("[data-add]")) openForm();
  if (target.dataset.action === "new-sale") {
    render("sales");
    openForm();
  }
  if (target.dataset.edit) openForm(target.dataset.edit);
  if (target.dataset.delete) void deleteRecord(target.dataset.delete);
  if (target.hasAttribute("data-export")) exportCsv();
});

content.addEventListener("input", (event) => {
  if (event.target.id === "record-search") {
    const position = event.target.selectionStart;
    render(activeView, event.target.value);
    const input = document.querySelector("#record-search");
    input.focus();
    input.setSelectionRange(position, position);
  }
});

document.querySelector("#mobile-menu").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
modal.addEventListener("click", (event) => {
  if (event.target === modal || event.target.closest(".close-modal")) closeForm();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeForm();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  for (const [key, value] of Object.entries(values)) {
    if (["quantity", "unitPrice", "unitCost", "amount", "balance", "stock", "capacity", "reorderLevel", "costPrice", "sellPrice"].includes(key) && value !== "") values[key] = Number(value);
  }
  try {
    const wasEditing = Boolean(editingId);
    const endpoint = `/api/${activeView}${editingId ? `/${encodeURIComponent(editingId)}` : ""}`;
    const method = editingId ? "PUT" : "POST";
    await api(endpoint, { method, body: JSON.stringify(values) });
    await refreshData();
    closeForm();
    render(activeView);
    showToast(wasEditing ? "Changes saved." : `${definitions[activeView].singular} added.`);
  } catch (error) {
    showToast(error.message);
  }
});

async function initialize() {
  content.innerHTML = '<div class="panel empty-state">Connecting to the FuelFlow database…</div>';
  try {
    await api("/api/health");
    await refreshData();
    document.querySelector(".today-label").innerHTML = '<span class="live-dot"></span> SQL Server connected';
    document.querySelector(".footer span:last-child").textContent = "Connected to Microsoft SQL Server";
    render();
  } catch (error) {
    console.error("FuelFlow could not load workspace data.", error);
    document.querySelector(".today-label").textContent = "Database unavailable";
    content.innerHTML = `<div class="panel"><h2 class="panel-title">Cannot connect to the database</h2><p class="panel-subtitle">${escapeHtml(error.message)}</p><p class="panel-subtitle">Check your SQL Server configuration, then restart the FuelFlow server.</p></div>`;
  }
}

void initialize();
