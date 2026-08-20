import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover disabled:opacity-40",
  secondary:
    "bg-surface text-ink border border-hairline-strong hover:bg-canvas disabled:opacity-40",
  ghost: "text-accent hover:bg-canvas disabled:opacity-40",
  danger: "bg-surface text-flag border border-hairline-strong hover:bg-flag/5",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
