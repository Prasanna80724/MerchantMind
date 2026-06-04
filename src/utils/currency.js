export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}
