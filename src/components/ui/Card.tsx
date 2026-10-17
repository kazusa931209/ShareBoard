import type { ReactNode } from "react";
import { cn } from "./cn";

type CardProps = {
  className?: string;
  children: ReactNode;
};

export function Card({ className, children }: CardProps) {
  return <div className={cn("card", className)}>{children}</div>;
}
