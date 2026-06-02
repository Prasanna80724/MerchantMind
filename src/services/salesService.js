import { API_BASE_URL, apiRequest } from "./api.js";

export const getSales = () => apiRequest("/sales");

export const recordSale = (sale) =>
  fetch(`${API_BASE_URL}/sale`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale),
  });

export const getTotalSales = () => apiRequest("/total-sales");
