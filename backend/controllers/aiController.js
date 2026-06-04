import { processChatQuestion, SUGGESTED_QUESTIONS } from "../services/ai/chatService.js";

const MAX_MESSAGE_LENGTH = 500;

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /you\s+are\s+now/i,
  /system\s*prompt/i,
  /\bact\s+as\b/i,
  /\bjailbreak\b/i,
  /\boverride\s+rules\b/i,
];

const CLIENT_ERRORS = {
  ASSISTANT_UNAVAILABLE:
    "The assistant is not available right now. Please try again later or contact support.",
  SCHEMA_UNAVAILABLE: "Required data is not available in the current system.",
  SQL_GENERATION_FAILED:
    "A safe query could not be generated from your question. Try rephrasing or narrowing the time range.",
  REQUEST_NOT_ALLOWED:
    "That query could not be run safely. Ask a read-only question about your shop data.",
  DATA_FETCH_FAILED:
    "I couldn't retrieve that information right now. Please try again in a moment.",
};

function validateMessage(raw) {
  if (typeof raw !== "string") {
    return { ok: false, error: "Please enter a question." };
  }

  const message = raw.trim();
  if (!message) {
    return { ok: false, error: "Please enter a question." };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Please keep your question under ${MAX_MESSAGE_LENGTH} characters.` };
  }
  if (INJECTION_PATTERNS.some((p) => p.test(message))) {
    return {
      ok: false,
      error: "Please ask a business question about your shop data.",
    };
  }

  return { ok: true, message };
}

function mapErrorMessage(err) {
  if (CLIENT_ERRORS[err.message]) return CLIENT_ERRORS[err.message];
  if (err.message?.includes("timed out")) {
    return "That took too long to answer. Try a simpler or more specific question.";
  }
  if (err.message?.includes("not configured") || err.message?.includes("temporarily unavailable")) {
    return CLIENT_ERRORS.ASSISTANT_UNAVAILABLE;
  }
  return "Something went wrong. Please try again.";
}

export const getSuggestedQuestions = (_req, res) => {
  res.json({ questions: SUGGESTED_QUESTIONS });
};

export const chatWithAssistant = async (req, res) => {
  const user_id = req.user.user_id;
  const username = req.user.username;
  const validation = validateMessage(req.body?.message);

  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const result = await processChatQuestion({
      question: validation.message,
      userId: user_id,
      username,
    });

    res.json(result);
  } catch (err) {
    console.error("[AI] Chat error:", err.message, err.detail || "");
    const message = mapErrorMessage(err);
    const status =
      err.message === "ASSISTANT_UNAVAILABLE" ? 503
      : err.message === "SCHEMA_UNAVAILABLE" ||
          err.message === "SQL_GENERATION_FAILED" ||
          err.message === "REQUEST_NOT_ALLOWED"
        ? 400
      : err.message?.includes("timed out") ? 504
      : 500;

    res.status(status).json({ error: message });
  }
};

export default chatWithAssistant;
