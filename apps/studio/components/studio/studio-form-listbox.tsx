"use client";

import { useState } from "react";
import { StudioListbox } from "@/components/studio/studio-listbox";

export function StudioFormListbox({
  name,
  label,
  initialValue,
  options,
  className = "",
}: {
  name: string;
  label: string;
  initialValue: string;
  options: readonly { value: string; label: string }[];
  className?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <StudioListbox
      className={className}
      name={name}
      label={label}
      value={value}
      onChange={setValue}
      options={[...options]}
      required
    />
  );
}
