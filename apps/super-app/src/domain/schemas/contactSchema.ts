import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  topic: z.string().min(3, "Topic is required"),
  message: z.string().min(10, "Please add a bit more detail"),
  divisionSlug: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
