"use client";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Topbar({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-8">
      <MobileNav />
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
