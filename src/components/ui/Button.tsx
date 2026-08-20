import Link from "next/link";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "highlight";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover disabled:opacity-40",
  secondary:
    "bg-surface text-ink border border-hairline-strong hover:bg-canvas disabled:opacity-40",
  ghost: "text-accent hover:bg-canvas disabled:opacity-40",
  danger: "bg-surface text-flag border border-hairline-strong hover:bg-flag/5",
  highlight: "bg-highlight text-accent hover:bg-highlight-hover disabled:opacity-40",
};

export function Button({
  variant = "primary",
  href,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  href?: string;
}) {
  const classes = `inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-[15px] font-semibold transition-all duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {props.children}
      </Link>
    );
  }
  return <button className={classes} {...props} />;
}
