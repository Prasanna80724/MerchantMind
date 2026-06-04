/**
 * Builds structured, executive-style presentation payloads (server-side only).
 */

export const LIST_PREVIEW = 5;

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] != null) return row[k];
  }
  return null;
}

function firstNumeric(row, columns) {
  for (const col of columns) {
    const v = row[col];
    if (v != null && !Number.isNaN(Number(v))) return Number(v);
  }
  for (const v of Object.values(row)) {
    if (v != null && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

function paginate(items, limit = LIST_PREVIEW) {
  const totalCount = items.length;
  const hasMore = totalCount > limit;
  return {
    items: items.slice(0, limit),
    allItems: hasMore ? items : undefined,
    totalCount,
    hasMore,
  };
}

function detectPresentationType(question, rows, columns) {
  const q = question.toLowerCase();
  const cols = new Set(columns.map((c) => c.toLowerCase()));

  if (rows.length === 0) return "empty";

  if (
    /how many|count|number of/i.test(q) &&
    (rows.length === 1 || (rows.length <= 3 && cols.size <= 2))
  ) {
    return "count";
  }

  if (
    rows.length === 1 &&
    (/revenue|total sales|sales total|earnings|profit|p&l|average order/i.test(q) ||
      cols.has("total_revenue") ||
      cols.has("revenue") ||
      cols.has("profit") ||
      cols.has("profit_or_loss") ||
      cols.has("net_profit") ||
      cols.has("average_order_value") ||
      cols.has("aov") ||
      (cols.has("total_price") && rows[0].total_price != null && !cols.has("p_name")))
  ) {
    return "revenue";
  }

  if (
    rows.length === 1 &&
    (cols.has("total_value") ||
      /inventory value|stock value|total value|worth of/i.test(q))
  ) {
    return "metric";
  }

  if (
    /pending.*(invoice|purchase|order)|open purchase/i.test(q) ||
    cols.has("po_number") ||
    cols.has("po_id")
  ) {
    return "purchase_orders";
  }

  if (
    /low stock|below threshold|reorder|out of stock|running low|restock/i.test(q) ||
    (cols.has("threshold") && cols.has("quantity"))
  ) {
    return "product_list";
  }

  if (
    /most stock|highest stock|top stock|largest stock|most inventory|highest inventory/i.test(q) ||
    (/most|highest|top|best|lowest/i.test(q) && cols.has("quantity") && !cols.has("threshold"))
  ) {
    return "ranking";
  }

  if (
    /best sell|top sell|most sold|popular product|highest sales|highest revenue|top customer|best customer/i.test(q) ||
    cols.has("total_quantity_sold") ||
    cols.has("sale_count") ||
    (cols.has("customer_name") && rows.length > 1)
  ) {
    return "ranking";
  }

  if (
    /supplier|vendor/i.test(q) &&
    (cols.has("supplier_id") || cols.has("supplier_name") || (cols.has("name") && !cols.has("p_name")))
  ) {
    return "supplier";
  }

  if (
    /sales|recent sale|latest sale/i.test(q) ||
    cols.has("sales_date") ||
    (cols.has("total_price") && cols.has("p_name"))
  ) {
    return "revenue";
  }

  if (cols.has("total_value") && cols.has("product_count")) {
    return "metric";
  }

  return "generic";
}

function titleForCount(question) {
  const q = question.toLowerCase();
  if (/below threshold|low stock|reorder|restock/i.test(q)) return "Products Below Threshold";
  if (/out of stock/i.test(q)) return "Out of Stock Products";
  if (/supplier/i.test(q)) return "Supplier Count";
  if (/product/i.test(q)) return "Product Count";
  return "Count";
}

function titleForRanking(question) {
  const q = question.toLowerCase();
  if (/customer/i.test(q)) return "Top Customers";
  if (/stock|inventory/i.test(q)) return "Highest Stock Items";
  if (/sell|sales|revenue/i.test(q)) return "Top Selling Products";
  return "Top Results";
}

function normalizeRankingItems(rows, columns, question) {
  const q = question.toLowerCase();
  const bySales = columns.some((c) => /total_quantity_sold|sale_count|revenue|total_price/i.test(c));

  const mapped = rows.map((row, idx) => {
    const name = pick(row, ["p_name", "product_name", "name", "supplier_name", "customer_name"]) || "Item";
    let value = Number(
      pick(row, [
        "quantity",
        "total_quantity_sold",
        "total_revenue",
        "total_price",
        "sale_count",
        "stock",
      ]) ?? 0
    );
    if (bySales && /sell|sales/i.test(q)) {
      value = Number(pick(row, ["total_quantity_sold", "sale_count", "quantity"]) ?? value);
    }
    return { rank: idx + 1, name, value };
  });

  mapped.sort((a, b) => b.value - a.value);
  return mapped.map((item, idx) => ({ ...item, rank: idx + 1 }));
}

function normalizeProductList(rows, variant) {
  return rows.map((row) => ({
    productId: pick(row, ["product_id", "productId"]),
    name: pick(row, ["p_name", "product_name", "name"]) || "Product",
    quantity: Number(pick(row, ["quantity", "stock", "qty"]) ?? 0),
    threshold: Number(pick(row, ["threshold"]) ?? 0),
    category: pick(row, ["category"]),
  }));
}

function normalizeSuppliers(rows) {
  return rows.map((row) => ({
    supplierId: pick(row, ["supplier_id", "supplierId"]),
    name: pick(row, ["name", "supplier_name"]) || "Supplier",
    email: pick(row, ["email", "supplier_email"]),
    phone: pick(row, ["phone_no", "phone"]),
    status: pick(row, ["status"]) || "Active",
  }));
}

function normalizePurchaseOrders(rows) {
  return rows.map((row) => ({
    poId: pick(row, ["po_id", "poId"]),
    poNumber: pick(row, ["po_number", "poNumber"]),
    productName: pick(row, ["product_name", "p_name"]),
    supplierName: pick(row, ["supplier_name", "name"]),
    status: pick(row, ["status"]) || "Pending",
    reorderQuantity: Number(pick(row, ["reorder_quantity", "quantity"]) ?? 0),
  }));
}

function revenueLabel(question) {
  const q = question.toLowerCase();
  if (/profit|p&l/i.test(q)) {
    if (/this month|monthly/i.test(q)) return "Profit This Month";
    if (/this week|weekly/i.test(q)) return "Profit This Week";
    return "Profit";
  }
  if (/average order|aov/i.test(q)) return "Average Order Value";
  if (/this week|weekly/i.test(q)) return "Revenue This Week";
  if (/this month|monthly/i.test(q)) return "Revenue This Month";
  if (/today/i.test(q)) return "Revenue Today";
  return "Total Revenue";
}

export function buildPresentation(question, results) {
  const { rows, columns, rowCount, truncated } = results;
  const type = detectPresentationType(question, rows, columns);
  const base = { type, rowCount, truncated, headline: "" };

  switch (type) {
    case "empty":
      return { ...base, title: "No Results", message: "No matching records." };

    case "count": {
      const value =
        rows.length === 1
          ? firstNumeric(rows[0], columns) ?? rowCount
          : rowCount;
      return {
        ...base,
        title: titleForCount(question),
        value: String(value),
        unit: Number(value) === 1 ? "product" : "products",
      };
    }

    case "revenue": {
      if (rows.length === 1 && firstNumeric(rows[0], columns) != null) {
        const row = rows[0];
        const amount = Number(
          pick(row, [
            "profit",
            "profit_or_loss",
            "net_profit",
            "total_revenue",
            "revenue",
            "total_price",
            "average_order_value",
            "aov",
          ]) ?? firstNumeric(row, columns) ?? 0
        );
        return {
          ...base,
          title: revenueLabel(question),
          amount,
        };
      }
      const items = rows.map((row) => ({
        name: pick(row, ["p_name", "product_name", "name"]) || "Sale",
        amount: Number(pick(row, ["total_price", "total_revenue", "revenue"]) ?? 0),
        date: pick(row, ["sales_date", "sale_date"]),
      }));
      const total = items.reduce((s, i) => s + i.amount, 0);
      const { items: preview, allItems, totalCount, hasMore } = paginate(items);
      return {
        ...base,
        title: /recent|latest/i.test(question) ? "Recent Sales" : revenueLabel(question),
        amount: total,
        items: preview,
        allItems,
        totalCount,
        hasMore,
        listMode: "sales",
      };
    }

    case "metric": {
      const row = rows[0] || {};
      return {
        ...base,
        title: "Total Inventory Value",
        amount: Number(
          pick(row, ["total_value", "inventory_value", "value"]) ??
            firstNumeric(row, columns) ??
            0
        ),
        secondary: [
          {
            label: "Products",
            value: String(pick(row, ["product_count", "products"]) ?? rowCount),
          },
          {
            label: "Units in Stock",
            value: String(pick(row, ["total_units", "total_quantity", "units"]) ?? "—"),
          },
        ].filter((s) => s.value !== "—"),
      };
    }

    case "ranking": {
      const ranked = normalizeRankingItems(rows, columns, question);
      const { items, allItems, totalCount, hasMore } = paginate(ranked);
      const valueLabel = /sell|sales/i.test(question) ? "units sold" : "units";
      return {
        ...base,
        title: titleForRanking(question),
        items,
        allItems,
        totalCount,
        hasMore,
        valueLabel,
      };
    }

    case "product_list": {
      const variant = /out of stock/i.test(question) ? "out_of_stock" : "low_stock";
      const all = normalizeProductList(rows, variant);
      const { items, allItems, totalCount, hasMore } = paginate(all);
      return {
        ...base,
        title: variant === "out_of_stock" ? "Out of Stock" : "Low Stock Products",
        variant,
        items,
        allItems,
        totalCount,
        hasMore,
      };
    }

    case "supplier": {
      const all = normalizeSuppliers(rows);
      const { items, allItems, totalCount, hasMore } = paginate(all);
      return {
        ...base,
        title: "Suppliers",
        items,
        allItems,
        totalCount,
        hasMore,
      };
    }

    case "purchase_orders": {
      const all = normalizePurchaseOrders(rows);
      const { items, allItems, totalCount, hasMore } = paginate(all);
      return {
        ...base,
        title: "Pending Purchase Orders",
        items,
        allItems,
        totalCount,
        hasMore,
      };
    }

    default: {
      const { items, allItems, totalCount, hasMore } = paginate(rows);
      return {
        ...base,
        type: "generic",
        title: "Results",
        items,
        allItems,
        totalCount,
        hasMore,
      };
    }
  }
}

export default buildPresentation;
