import { apiRequest } from "./api.js";

export const getSalesReport = () => apiRequest("/sales-report");

export const getMonthlyStats = () => apiRequest("/monthly-stats");
