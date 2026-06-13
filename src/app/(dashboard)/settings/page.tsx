"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/hooks/use-user";
import { getPreferences, updatePreferences, updateProfile } from "@/services/preferences";
import { CURRENCIES } from "@/lib/constants";

type ThemePref = "light" | "dark" | "system";
interface PrefsState { currency: string; locale: string; theme: ThemePref }

export default function SettingsPage() {
  const { user } = useUser();
  const [prefs, setPrefs] = useState<PrefsState>({ currency: "USD", locale: "en-US", theme: "system" });
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPreferences()
      .then((p) => {
        if (p) setPrefs({ currency: p.currency, locale: p.locale, theme: (p.theme as ThemePref) ?? "system" });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setFullName((user.user_metadata?.full_name as string) ?? "");
  }, [user]);

  const name = fullName || user?.email || "Account";
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { full_name: fullName });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function savePrefs() {
    if (!user) return;
    setSaving(true);
    try {
      await updatePreferences(user.id, { currency: prefs.currency, locale: prefs.locale, theme: prefs.theme });
      toast.success("Preferences saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Topbar title="Settings" />
      <main className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    {user?.user_metadata?.avatar_url ? <AvatarImage src={user.user_metadata.avatar_url as string} /> : null}
                    <AvatarFallback className="text-lg">{initials || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} disabled />
                </div>
                <Button onClick={saveProfile} disabled={saving}>Save profile</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Currency and formatting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select value={prefs.currency} onValueChange={(v) => setPrefs((p) => ({ ...p, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Locale</Label>
                    <Input value={prefs.locale} onChange={(e) => setPrefs((p) => ({ ...p, locale: e.target.value }))} placeholder="en-US" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Theme</Label>
                  <Select value={prefs.theme} onValueChange={(v) => setPrefs((p) => ({ ...p, theme: v as ThemePref }))}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={savePrefs} disabled={saving}>Save preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
