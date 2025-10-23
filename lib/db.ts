import { schema } from "@/schemas/main";
import { drizzle } from "drizzle-orm/libsql";

export const db = drizzle({
  schema: schema,
  connection: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
