import { AppLayout } from "@/components/layout/AppLayout";
import { useGetMe, useGetEntitlement, useListSubAccounts, useListMembers, useListInvites } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Building2, Users, UserPlus, ArrowRight, ShieldCheck, Clock, AlertTriangle, Smartphone } from "lucide-react";
import { format } from "date-fns";

export default function Overview() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const { data: entitlement, isLoading: entitlementLoading } = useGetEntitlement();
  const { data: subAccounts, isLoading: subAccountsLoading } = useListSubAccounts();
  const { data: members, isLoading: membersLoading } = useListMembers();
  const { data: invites, isLoading: invitesLoading } = useListInvites();

  if (meLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const activeMembership = me?.memberships?.find(m => m.status === "active");
  const highestRole = activeMembership?.role;

  // Member-only view
  if (!highestRole || highestRole === "member") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight">Your Access</h1>
            <p className="text-muted-foreground mt-2">Welcome to Authentic Steps.</p>
          </div>

          <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-medium">Authentic Steps lives in the mobile app</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  This dashboard is for agency staff. As a member, please use the Authentic Steps
                  app on your phone to check in, track your streak, and redeem invite codes — this
                  page is just a status page.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Access Status
                </CardTitle>
                {entitlementLoading ? (
                  <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                ) : (
                  <Badge variant={entitlement?.active ? "default" : "destructive"}>
                    {entitlement?.active ? "Active" : "Inactive"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {!entitlementLoading && entitlement && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Reason
                    </p>
                    <p className="font-medium capitalize">{entitlement.reason}</p>
                  </div>
                  {entitlement.expiresAt && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Expires At
                      </p>
                      <p className="font-medium">{format(new Date(entitlement.expiresAt), "PPP")}</p>
                    </div>
                  )}
                  {entitlement.role && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Role</p>
                      <p className="font-medium capitalize">{entitlement.role.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6 border-t border-border/50">
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-primary-foreground">Have an invite code?</h4>
                    <p className="text-sm text-muted-foreground">Redeem it to gain access to a new program.</p>
                  </div>
                  <Link href="/redeem" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                    Redeem Code <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Management view
  const activeMembers = members?.filter(m => m.status === "active")?.length || 0;
  const pendingInvites = invites?.filter(i => i.status === "pending")?.length || 0;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-2">Welcome back. Here's a summary of your agency scope.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-elevate transition-all border-card-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Members
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{members?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-emerald-600 font-medium">{activeMembers}</span> active members
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {highestRole === "agency_admin" && (
            <Card className="hover-elevate transition-all border-card-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Sub-Accounts
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subAccountsLoading ? (
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                ) : (
                  <div className="text-3xl font-bold">{subAccounts?.length || 0}</div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="hover-elevate transition-all border-card-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Pending Invites
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invitesLoading ? (
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              ) : (
                <div className="text-3xl font-bold">{pendingInvites}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-card-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Manage access for your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/invites" className="flex items-center p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Issue New Invite</h4>
                  <p className="text-xs text-muted-foreground">Create a shareable link for a new member</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
              
              <Link href="/members" className="flex items-center p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Manage Members</h4>
                  <p className="text-xs text-muted-foreground">View, renew, or revoke existing access</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
