import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useGetMe, type MembershipRole } from "@workspace/api-client-react";
import { getActiveRole } from "@/lib/roles";

interface RoleGateProps {
  allow: MembershipRole[];
  children: ReactNode;
}

export function RoleGate({ allow, children }: RoleGateProps) {
  const { data: me, isLoading, isError } = useGetMe();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const role = isError ? undefined : getActiveRole(me?.memberships);

  if (!role || !allow.includes(role)) {
    return <Redirect to="/overview" />;
  }

  return <>{children}</>;
}
