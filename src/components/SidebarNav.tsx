"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import type { NavItem } from "./AppShell";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SidebarNav({ groups }: { groups: { items: NavItem[] }[] }) {
  const pathname = usePathname();
  return (
    <nav className="yc-sb-nav">
      {groups.map((group, gi) => (
        <div key={gi} className="yc-sb-group">
          {group.items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.id} href={item.href} className={`yc-sb-item ${active ? "active" : ""}`}>
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
                {item.chevron && (
                  <Icon name="ChevronRight" size={12} style={{ marginLeft: "auto", color: "#94a3b8" }} />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
