import { z } from "zod";

// Maximums mirror the contact_submissions CHECKs / insert policy in
// supabase/migrations/20260405120000_super_app_core.sql so the form rejects
// what the database would (JS counts UTF-16 units — marginally stricter).
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(200, "Name is too long"),
  email: z.string().trim().email("Valid email required").max(320, "Email is too long"),
  topic: z.string().trim().min(3, "Topic is required").max(200, "Topic is too long"),
  message: z
    .string()
    .trim()
    .min(10, "Please add a bit more detail")
    .max(5000, "Please keep your message under 5000 characters"),
  divisionSlug: z.string().max(64).optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
