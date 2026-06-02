import { API_BASE_URL, apiRequest } from "./api.js";

export const getInventory = () => apiRequest("/inventory");

export const getProductsCatalog = () => apiRequest("/products");

export const addProduct = (product) =>
  fetch(`${API_BASE_URL}/add-products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });

export const deleteProduct = async (productId) => {
  const response = await fetch(`${API_BASE_URL}/delete-product/${productId}`, { method: "DELETE" });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete product");
  }
  return response;
};

export const getProductSales = () => apiRequest("/product-sales");

export const getTopSellingProducts = () => apiRequest("/top-selling-products");
