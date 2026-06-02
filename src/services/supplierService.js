import { API_BASE_URL, apiRequest } from "./api.js";

export const getSuppliers = () => apiRequest("/suppliers");

/** Active suppliers only — for supply form dropdowns. */
export const getActiveSuppliers = () => apiRequest("/getsupp");

export const getSupplies = () => apiRequest("/supplies");

export const getSupplyAuditLog = (supplyId) => apiRequest(`/supplies/${supplyId}/audit`);

export const addSupplier = (supplier) =>
  fetch(`${API_BASE_URL}/add-suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
    }),
  });

export const recordSupply = (supply) =>
  fetch(`${API_BASE_URL}/record-supply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(supply),
  });

export const updateSupply = async (supplyId, payload) => {
  const response = await fetch(`${API_BASE_URL}/supplies/${supplyId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update supply");
  }
  return response.json();
};

export const updateSupplierStatus = async (supplierId, status) => {
  const response = await fetch(`${API_BASE_URL}/suppliers/${supplierId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update supplier status");
  }
  return response.json();
};

export const deactivateSupplier = (supplierId) => updateSupplierStatus(supplierId, "Inactive");

export const reactivateSupplier = (supplierId) => updateSupplierStatus(supplierId, "Active");
