import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: boolean;
  hover?: boolean;
}

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export function Card({
  children,
  className = "",
  padding = "md",
  shadow = true,
  hover = false,
}: CardProps) {
  return (
    <div
      className={[
        "rounded-xl bg-white border border-neutral-200",
        shadow && "shadow-sm",
        hover && "transition-shadow hover:shadow-md cursor-pointer",
        paddingStyles[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={`mb-4 border-b border-neutral-100 pb-3 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-brand-navy ${className}`}>
      {children}
    </h3>
  );
}
