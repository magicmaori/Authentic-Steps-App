import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { UserProfileButton } from "@/components/UserProfileButton";
import { LayoutDashboard, Users, UserPlus, Building2 } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { getActiveRole } from "@/lib/roles";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { data: me } = useGetMe();

  const role = getActiveRole(me?.memberships);

  const navItems = [
    { href: "/overview", label: "Overview", icon: LayoutDashboard },
    ...(role === "agency_admin" ? [{ href: "/sub-accounts", label: "Sub-Accounts", icon: Building2 }] : []),
    ...(role === "agency_admin" || role === "sub_account_holder" ? [
      { href: "/members", label: "Members", icon: Users },
      { href: "/invites", label: "Invites", icon: UserPlus },
    ] : []),
  ];

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <header className="md:hidden border-b border-border bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={`${window.location.origin}${basePath}/logo.svg`} alt="Authentic Steps" className="h-8" />
        </div>
        <UserProfileButton />
      </header>

      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6">
          <img src={`${window.location.origin}${basePath}/logo.svg`} alt="Authentic Steps" className="h-10" />
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? "bg-primary text-primary-foreground font-medium shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <UserProfileButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
