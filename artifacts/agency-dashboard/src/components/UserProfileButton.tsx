import { useClerk, Show } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function UserProfileButton() {
  const clerk = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleLogout = () => {
    clerk.signOut({ redirectUrl: basePath || "/" });
  };

  return (
    <Show when="signed-in">
      <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </Show>
  );
}
