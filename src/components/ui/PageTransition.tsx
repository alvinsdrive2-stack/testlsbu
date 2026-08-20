"use client";

import { usePathname } from "next/navigation";

export function PageTransition({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={`animate-page-enter ${className}`}>
      {children}
    </div>
  );
}
