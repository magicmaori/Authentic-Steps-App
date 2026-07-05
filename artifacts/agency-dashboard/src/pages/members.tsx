import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListMembers, useListSubAccounts, useRenewMember, useRevokeMember, getListMembersQueryKey, useGetMe, getListSubAccountsQueryKey } from "@workspace/api-client-react";
import { getActiveRole } from "@/lib/roles";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, isPast } from "date-fns";
import { Users, Search, MoreHorizontal, Clock, Ban, CheckCircle2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

export default function Members() {
  const { data: me } = useGetMe();
  const role = getActiveRole(me?.memberships);
  
  const [subAccountFilter, setSubAccountFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const { data: members, isLoading: membersLoading } = useListMembers(
    subAccountFilter !== "all" ? { subAccountId: subAccountFilter } : undefined
  );
  const isAgencyAdmin = role === "agency_admin";
  const { data: subAccounts } = useListSubAccounts({ query: { enabled: isAgencyAdmin, queryKey: getListSubAccountsQueryKey() } });
  
  const renewMember = useRenewMember();
  const revokeMember = useRevokeMember();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [renewalDays, setRenewalDays] = useState("30");

  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  const handleRenew = () => {
    if (!selectedMemberId) return;
    const days = parseInt(renewalDays, 10);
    
    renewMember.mutate(
      { id: selectedMemberId, data: isNaN(days) ? undefined : { accessDurationDays: days } },
      {
        onSuccess: () => {
          toast({ title: "Access renewed", description: "The member's access has been extended." });
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          setRenewDialogOpen(false);
          setSelectedMemberId(null);
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Renewal failed", description: err.message });
        }
      }
    );
  };

  const handleRevoke = () => {
    if (!selectedMemberId) return;
    
    revokeMember.mutate(
      { id: selectedMemberId },
      {
        onSuccess: () => {
          toast({ title: "Access revoked", description: "The member's access has been terminated." });
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          setRevokeDialogOpen(false);
          setSelectedMemberId(null);
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Revocation failed", description: err.message });
        }
      }
    );
  };

  const filteredMembers = members?.filter(m => {
    if (search && !m.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const hasMemberFilter = Boolean(search) || subAccountFilter !== "all";

  const getSubAccountName = (id?: string | null) => {
    if (!id) return "Global / All";
    return subAccounts?.find(sa => sa.id === id)?.name || id;
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-2">Manage user access, roles, and expirations across your programs.</p>
        </div>

        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Access Roster
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by email..." 
                    className="pl-9 h-9" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {role === "agency_admin" && (
                  <Select value={subAccountFilter} onValueChange={setSubAccountFilter}>
                    <SelectTrigger className="h-9 w-full sm:w-[200px]">
                      <SelectValue placeholder="All Sub-Accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sub-Accounts</SelectItem>
                      {subAccounts?.map(sa => (
                        <SelectItem key={sa.id} value={sa.id}>{sa.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {membersLoading ? (
              <div className="p-8 space-y-4">
                <div className="h-10 bg-muted/50 rounded animate-pulse"></div>
                <div className="h-10 bg-muted/50 rounded animate-pulse"></div>
                <div className="h-10 bg-muted/50 rounded animate-pulse"></div>
              </div>
            ) : filteredMembers?.length === 0 ? (
              <Empty className="border-0 py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>{hasMemberFilter ? "No matching members" : "No members yet"}</EmptyTitle>
                  <EmptyDescription>
                    {hasMemberFilter
                      ? "Try adjusting your filters or search query to find members."
                      : "Members gain access by redeeming an invite link. Send your first invite to add someone to your program."}
                  </EmptyDescription>
                </EmptyHeader>
                {!hasMemberFilter && (
                  <EmptyContent>
                    <Button asChild>
                      <Link href="/invites">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite your first member
                      </Link>
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sub-Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers?.map((m) => {
                    const isExpired = m.accessExpiresAt && isPast(new Date(m.accessExpiresAt));
                    
                    return (
                      <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{m.email || "Unknown"}</TableCell>
                        <TableCell className="capitalize">{m.role.replace(/_/g, ' ')}</TableCell>
                        <TableCell className="text-muted-foreground">{getSubAccountName(m.subAccountId)}</TableCell>
                        <TableCell>
                          {m.status === "revoked" ? (
                            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">Revoked</Badge>
                          ) : isExpired ? (
                            <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20">Expired</Badge>
                          ) : (
                            <Badge variant="default" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.accessExpiresAt ? format(new Date(m.accessExpiresAt), "MMM d, yyyy") : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedMemberId(m.id);
                                  setRenewDialogOpen(true);
                                }}
                                disabled={m.status === "revoked"}
                              >
                                <Clock className="mr-2 h-4 w-4" /> Renew Access
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedMemberId(m.id);
                                  setRevokeDialogOpen(true);
                                }}
                                disabled={m.status === "revoked"}
                              >
                                <Ban className="mr-2 h-4 w-4" /> Revoke Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Renew Dialog */}
        <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Renew Member Access</DialogTitle>
              <DialogDescription>
                Extend access for this member. Leave blank for indefinite access.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="days">Duration (Days)</Label>
                <Input 
                  id="days" 
                  type="number" 
                  value={renewalDays} 
                  onChange={(e) => setRenewalDays(e.target.value)} 
                  placeholder="e.g., 30"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRenew} disabled={renewMember.isPending}>
                {renewMember.isPending ? "Renewing..." : "Confirm Renewal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revoke Dialog */}
        <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Revoke Access</DialogTitle>
              <DialogDescription>
                Are you sure you want to revoke this member's access immediately? They will no longer be able to use the service.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRevoke} disabled={revokeMember.isPending}>
                {revokeMember.isPending ? "Revoking..." : "Revoke Access"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
