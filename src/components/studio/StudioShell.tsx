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

type StudioShellProps = {
  userId: string;
  children: ReactNode;
};

export function StudioShell({ userId, children }: StudioShellProps) {
  const pathname = usePathname();

  return (
    <div className="studio">
      <header className="studio-header">
        <div className="studio-header-start">
          <Link href="/board" className="studio-header-brand">
            ShareBoard
          </Link>
          <nav className="studio-nav" aria-label="Main navigation">
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
        </div>
        <div className="studio-header-end">
          <span className="studio-header-user">{userId}</span>
          <StudioSignOutButton />
        </div>
      </header>
      <main className="studio-content">{children}</main>
    </div>
  );
}
