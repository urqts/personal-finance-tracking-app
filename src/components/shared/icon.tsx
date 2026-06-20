"use client";
import { icons } from "lucide-react";
import { cn } from "@/lib/utils";

export function Icon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const toPascal = (s: string) =>
    s.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  const Lucide = (icons as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[toPascal(name)] ?? icons.Circle;
  return <Lucide className={cn("h-4 w-4", className)} style={style} />;
}
