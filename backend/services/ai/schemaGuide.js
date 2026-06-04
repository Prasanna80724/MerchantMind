/**
 * Schema semantics for Text-to-SQL (not intents). Appended to INFORMATION_SCHEMA context.
 */
export const SCHEMA_DOMAIN_GUIDE = `
MERCHANTMIND DATA MODEL (answer only from tables/columns in the schema above):

Tenant isolation:
- Tables with user_id must filter user_id = {userId} (use this exact numeric literal in SQL).

Core entities:
- products: catalog (p_name, price, category, threshold). No stock column on products.
- inventory: stock per product (quantity). Join: inventory.product_id = products.product_id AND same user_id.
- sales: line-level sales (quantity, total_price, customer_name, payment_method, sales_date).
- product_supplied: inbound supply (quantity, purchase_cost, supplied_date, supplier_id).
- suppliers: supplier_id, name, email, phone_no, status.
- purchase_orders: po_number, status, reorder_quantity; never SELECT document_pdf.

Business term mappings (use these SQL patterns when asked):
- Revenue / sales total / earnings: SUM(sales.total_price) with date filters on sales.sales_date.
- Sales this week/month: filter sales.sales_date to the requested period.
- Profit / profit this month / P&L: SUM(sales.total_price) minus SUM(product_supplied.purchase_cost) for the same calendar period (no profit column exists).
- Most sold item / top selling product / highest revenue product: aggregate sales by product_id, join products for p_name, ORDER BY SUM(quantity) or SUM(total_price) DESC, LIMIT as requested.
- Top customer / best customer: GROUP BY sales.customer_name (there is no customers table; customer_name is on sales rows only).
- Average order value / AOV: AVG(sales.total_price) per sale row, or SUM(total_price)/COUNT(*) for the period.
- Inventory value / stock value: SUM(inventory.quantity * products.price) with joins on product_id and user_id.
- Top N products by stock / most stock: ORDER BY inventory.quantity DESC, join products for names.
- Low stock / below threshold: inventory.quantity < products.threshold.
- Supplier supplied most products: COUNT(*) or SUM(quantity) from product_supplied GROUP BY supplier_id, join suppliers.name.
- Products not sold recently: products LEFT JOIN sales, filter MAX(sales.sales_date) NULL or older than N days.
- Purchase orders pending / pending approval: purchase_orders WHERE status = 'Pending' (or LIKE 'Pending%').
- Products added this month: filter products.created_at.
- Inventory turnover (if asked): approximate as SUM(sales.quantity) / NULLIF(AVG(inventory.quantity), 0) for a period using joins; if too ambiguous, return SCHEMA_UNAVAILABLE with brief reason.

Do NOT invent tables or columns (e.g. customers, orders, profits, invoices for sales).
If the question needs data that does not exist in the schema, output exactly one line:
SCHEMA_UNAVAILABLE: <short reason>
`.trim();

export function buildSchemaGuide(userId) {
  return SCHEMA_DOMAIN_GUIDE.replace(/\{userId\}/g, String(userId));
}

export default buildSchemaGuide;
