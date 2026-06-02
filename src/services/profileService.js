import { API_BASE_URL, apiRequest } from "./api.js";

export const getProfile = () => apiRequest("/profile");

export const updateCompanyProfile = async (profile) => {
  const response = await fetch(`${API_BASE_URL}/profile/company`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update profile");
  }
  return response.json();
};
