import type { Config } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });

console.log("environment variables", process.env);
if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not set");
}
export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
} satisfies Config;
