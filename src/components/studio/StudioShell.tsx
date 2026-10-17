"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StudioSignOutButton } from "@/components/studio/StudioSignOutButton";

const NAV = [
  { href: "/board", label: "Board" },
  { href: "/share", label: "Share with" },
  { href: "/settings", label: "Settings" },
] as const;

const TITLES: Record<string, string> = {
  "/board": "Board",
  "/share": "Share with",
  "/settings": "Settings",
};

type StudioShellProps = {
  userId: string;
  children: ReactNode;
};

export function StudioShell({ userId, children }: StudioShellProps) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "ShareBoard";

  return (
    <div className="studio">
      <header className="studio-header">
        <h1 className="studio-header-title">{title}</h1>
        <div className="studio-header-end">
          <span className="studio-header-user">{userId}</span>
          <StudioSignOutButton />
        </div>
      </header>
      <div className="studio-body">
        <aside className="studio-sidebar" aria-label="Main navigation">
          <div className="studio-sidebar-brand">ShareBoard</div>
          <nav className="studio-nav">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active ? "studio-nav-link studio-nav-link--active" : "studio-nav-link"
                  }
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="studio-content">{children}</main>
      </div>
    </div>
  );
}
