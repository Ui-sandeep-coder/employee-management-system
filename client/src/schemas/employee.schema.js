import { z } from "zod";

export const employeeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters."),

  email: z
    .string()
    .trim()
    .pipe(
      z.email({
        error: "Please enter a valid email address.",
      }),
    ),

  department: z
    .string()
    .trim()
    .min(1, "Please select a department."),

  role: z
    .string()
    .trim()
    .min(2, "Job title must contain at least 2 characters.")
    .max(100, "Job title cannot exceed 100 characters."),
});