
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(
      z.email({
        error: "Please enter a valid email address.",
      }),
    ),

  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password is too long."),
});
