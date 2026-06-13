"use client";
import { useState } from "react";
import { Menu, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SidebarNav } from "./sidebar-nav";
import { APP_NAME } from "@/lib/constants";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="left-0 top-0 h-full max-w-[16rem] translate-x-0 translate-y-0 rounded-none border-r p-0 sm:rounded-none">
        <DialogTitle className="flex h-16 items-center gap-2 px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </span>
          {APP_NAME}
        </DialogTitle>
        <div className="py-2">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
