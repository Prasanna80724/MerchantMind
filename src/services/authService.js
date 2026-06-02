import axios from "./api.js";
import { API_BASE_URL, TOKEN_KEY, getToken } from "./api.js";

export { getToken };

export const setSession = ({ token, username, user_id }) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (username) localStorage.setItem("username", username);
  if (user_id != null) localStorage.setItem("user_id", String(user_id));
  localStorage.setItem("isAuthenticated", "true");
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("username");
  localStorage.removeItem("user_id");
  localStorage.removeItem("isAuthenticated");
};

export const isAuthenticated = () => Boolean(getToken());

export const getStoredUser = () => ({
  username: localStorage.getItem("username"),
  user_id: localStorage.getItem("user_id"),
});

export const login = (credentials) =>
  axios.post(`${API_BASE_URL}/login`, credentials);

export const signup = (userData) =>
  axios.post(`${API_BASE_URL}/signup`, userData);
