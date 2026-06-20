import React from "react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({
  src,
  alt = "",
  size = "md",
  className = "",
}: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`rounded-full object-cover ${sizeStyles[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-brand-navy text-brand-white font-semibold ${sizeStyles[size]} ${className}`}
    >
      {getInitials(alt || "?")}
    </div>
  );
}
