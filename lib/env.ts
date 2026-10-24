import { z } from "zod";

const envSchema = z.object({
  // Next.js runtime environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Application public URL
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty"),

  // Supabase Server Secret (Server-only)
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY cannot be empty")
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `  - [${issue.path.join(".")}]: ${issue.message}`)
      .join("\n");

    const message = `[CaféFlow BD] Invalid environment configuration:\n${errorDetails}\n\nPlease check your .env or .env.local file. Refer to .env.example for required variables.`;

    // In build or production environments, throw an explicit error to prevent misconfigured deployments
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    } else {
      console.warn(`\x1b[33m${message}\x1b[0m`);
      // Provide fallback values in development so builds/scaffolding during Phase 0 succeed cleanly
      return {
        NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") || "development",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL:
          process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo-project.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-anon-key-cafeflow-phase0",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      };
    }
  }

  return parsed.data;
}

export const env = validateEnv();
