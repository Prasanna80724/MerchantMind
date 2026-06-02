import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const REQUIRED_VARS = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET"];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]?.trim());
  if (missing.length === 0) return;

  console.error("Missing required environment variable(s):");
  for (const key of missing) {
    console.error(`  ${key}`);
  }
  console.error("\nCopy backend/.env.example to backend/.env and set the values.");
  process.exit(1);
}

validateEnv();

const env = {
  port: Number.parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  db: {
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
  email: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number.parseInt(process.env.EMAIL_PORT || "587", 10),
  },
  uploadPath: process.env.UPLOAD_PATH || "uploads",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  cron: {
    lowStockPurchaseOrder: process.env.CRON_LOW_STOCK_PO || "*/1 * * * *",
  },
};

export default env;
