import axios from "axios";

export const API_BASE_URL = "http://localhost:5000/api";
export const API_HOST = "localhost:5000";
export const TOKEN_KEY = "token";

const isLoginRequest = (url = "") =>
  url.includes("/api/login") || url.toLowerCase().includes("/api/signup");

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const handleUnauthorized = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("username");
  localStorage.removeItem("user_id");
  localStorage.removeItem("isAuthenticated");
  if (window.location.pathname !== "/") {
    window.location.replace("/");
  }
};

axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !isLoginRequest(error.config?.url)) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input?.url || "";
  const token = getToken();

  if (token && url.includes(API_HOST) && !isLoginRequest(url)) {
    init = { ...init, headers: { ...(init.headers || {}) } };
    if (!init.headers.Authorization) {
      init.headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await originalFetch(input, init);
  if (response.status === 401 && url.includes(API_HOST) && !isLoginRequest(url)) {
    handleUnauthorized();
  }
  return response;
};

export const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || "Request failed");
  }
  return response.json();
};

export default axios;
