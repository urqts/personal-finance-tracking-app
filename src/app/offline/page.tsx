import Link from "next/link";
import { WifiOff } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">You&apos;re offline</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {APP_NAME} needs an internet connection to load your latest finances. Reconnect and try again.
        </p>
      </div>
      <Link href="/dashboard" className="text-sm font-medium underline underline-offset-4">
        Retry
      </Link>
    </div>
  );
}
