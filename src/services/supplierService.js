import { API_BASE_URL, apiRequest } from "./api.js";

export const getSuppliers = () => apiRequest("/suppliers");

export const addSupplier = (supplier) =>
  fetch(`${API_BASE_URL}/add-suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(supplier),
  });

export const deleteSupplier = (supplierId) =>
  fetch(`${API_BASE_URL}/delete-supplier/${supplierId}`, { method: "DELETE" });
