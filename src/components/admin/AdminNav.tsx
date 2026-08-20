"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/modules", label: "Modul" },
  { href: "/admin/activities", label: "Kegiatan" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-8">
      {nav.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`border-b-2 pb-1 text-sm font-medium transition-colors ${
              active
                ? "border-flag text-ink"
                : "border-transparent text-ink-secondary hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
