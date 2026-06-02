import { API_BASE_URL, apiRequest } from "./api.js";

export const getInventory = () => apiRequest("/inventory");

export const getSuppliersList = () => apiRequest("/getsupp");

export const addProduct = (product) =>
  fetch(`${API_BASE_URL}/add-products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });

export const addInventory = (inventory) =>
  fetch(`${API_BASE_URL}/add-inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inventory),
  });

export const deleteProduct = (productId) =>
  fetch(`${API_BASE_URL}/delete-product/${productId}`, { method: "DELETE" });

export const getProductSales = () => apiRequest("/product-sales");

export const getTopSellingProducts = () => apiRequest("/top-selling-products");
