"use client";
import { Link, usePathname } from "@/i18n/navigation";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="main">
      {items.map((i) => {
        const on = i.href === "/" ? path === "/" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={on ? "on" : undefined}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
