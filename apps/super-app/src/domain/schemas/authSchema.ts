import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "At least 8 characters"),
});

export type SignInValues = z.infer<typeof signInSchema>;
