import { API_BASE_URL, apiRequest } from "./api.js";

export const getPendingInvoices = () => apiRequest("/pending");

export const approveInvoice = (invoiceId) =>
  fetch(`${API_BASE_URL}/approve/${invoiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

export const declineInvoice = (invoiceId) =>
  fetch(`${API_BASE_URL}/decline/${invoiceId}`, { method: "DELETE" });
