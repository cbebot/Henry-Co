import { contactSchema } from "@/domain/schemas/contactSchema";

describe("contactSchema", () => {
  it("accepts valid payloads", () => {
    const res = contactSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      topic: "Partnership",
      message: "We would like to explore collaboration.",
    });
    expect(res.success).toBe(true);
  });

  it("rejects short messages", () => {
    const res = contactSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      topic: "Hi",
      message: "short",
    });
    expect(res.success).toBe(false);
  });
});
