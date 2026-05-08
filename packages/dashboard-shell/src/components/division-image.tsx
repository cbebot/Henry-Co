import Image, { type ImageProps } from "next/image";
import type { CSSProperties } from "react";

/**
 * DivisionImage — Cloudinary-aware Next/Image wrapper.
 *
 * Closes anti-pattern #2 (raw `<img>` tags). Every product / vendor /
 * gallery image in the shell flows through this primitive; downstream
 * modules consume it for marketplace cards, property listings,
 * studio gallery thumbnails.
 *
 * Cloudinary detection: any URL containing `res.cloudinary.com`
 * triggers the Cloudinary loader. Otherwise the standard Next/Image
 * loader applies.
 *
 * Required: `alt` is non-optional (V2-A11Y-01 mandate). Empty string
 * is allowed for purely decorative images, but the prop must be
 * present.
 */
export type DivisionImageProps = Omit<ImageProps, "alt" | "loader" | "src"> & {
  src: string;
  alt: string;
  /** Override the radius. Default: 0.75rem. */
  radius?: string;
  /**
   * className for the inner `<img>` — same semantic as next/image's
   * `className`. Use for `object-fit`, hover transforms, etc.
   */
  className?: string;
  /** className for the wrapper span. */
  containerClassName?: string;
  /** Wrapping container style — merged AFTER defaults. */
  containerStyle?: CSSProperties;
};

export function DivisionImage({
  src,
  alt,
  radius = "0.75rem",
  className,
  containerClassName,
  containerStyle,
  width,
  height,
  fill,
  sizes,
  priority,
  ...rest
}: DivisionImageProps) {
  const isCloudinary = typeof src === "string" && src.includes("res.cloudinary.com");
  const loader = isCloudinary
    ? ({ src: s, width: w, quality: q }: { src: string; width: number; quality?: number }) => {
        // Cloudinary URL transform — inject f_auto,q_auto + width
        // into the URL. This is a minimal loader; the full Cloudinary
        // loader is in the existing apps/marketplace setup. For shell-
        // level use, the minimal pattern suffices.
        const transform = `f_auto,q_${q ?? "auto"},w_${w}`;
        // Replace the segment immediately after `/upload/` with the transform.
        return s.replace(/\/upload\/(?!.*\/upload\/)/, `/upload/${transform}/`);
      }
    : undefined;

  // When `fill` is set, the inner <Image> uses position: absolute;
  // inset: 0; which only works inside a sized, positioned parent.
  // Make the wrapper fill its own parent so callers don't need to
  // know about the wrapper's existence — they pass `fill` as they
  // would to next/image and the geometry is identical.
  const wrapperStyle: CSSProperties = fill
    ? {
        position: "absolute",
        inset: 0,
        display: "block",
        overflow: "hidden",
        borderRadius: radius,
        ...containerStyle,
      }
    : {
        position: "relative",
        display: "inline-block",
        overflow: "hidden",
        borderRadius: radius,
        ...containerStyle,
      };

  return (
    <span className={containerClassName} style={wrapperStyle}>
      <Image
        src={src}
        alt={alt}
        loader={loader}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={className}
        {...rest}
      />
    </span>
  );
}
