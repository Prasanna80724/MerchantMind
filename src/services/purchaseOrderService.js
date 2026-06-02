import { API_BASE_URL, apiRequest } from "./api.js";

export const getPurchaseOrders = () => apiRequest("/purchase-orders");

export const getPurchaseOrderPreview = (poId) => apiRequest(`/purchase-orders/${poId}/preview`);

export const downloadPurchaseOrderPdf = async (poId, filename) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/purchase-orders/${poId}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to download purchase order PDF");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const approvePurchaseOrder = (poId) =>
  fetch(`${API_BASE_URL}/purchase-orders/${poId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

export const declinePurchaseOrder = (poId) =>
  fetch(`${API_BASE_URL}/purchase-orders/${poId}/decline`, { method: "DELETE" });
