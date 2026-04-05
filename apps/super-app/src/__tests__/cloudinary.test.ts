import { buildCloudinaryUrl } from "@/core/cloudinary";

describe("cloudinary", () => {
  it("builds delivery url with transforms", () => {
    const url = buildCloudinaryUrl("logo-wordmark", { width: 120, format: "png" });
    expect(url).toContain("res.cloudinary.com");
    expect(url).toContain("w_120");
    expect(url).toContain("f_png");
    expect(url).toContain("henryco/logo-wordmark");
  });
});
