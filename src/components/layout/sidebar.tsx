"use client";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { SidebarNav } from "./sidebar-nav";
import { APP_NAME } from "@/lib/constants";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </span>
          {APP_NAME}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <SidebarNav />
      </div>
    </aside>
  );
}
