import { HTMLAttributes } from "react";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-hairline bg-surface shadow-[0_1px_3px_rgba(15,20,25,0.06)] ${className}`}
      {...props}
    />
  );
}
