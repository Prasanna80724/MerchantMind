import { apiRequest } from "./api.js";

export const getSuggestedQuestions = () => apiRequest("/ai/suggestions");

export const sendChatMessage = (message) =>
  apiRequest("/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
