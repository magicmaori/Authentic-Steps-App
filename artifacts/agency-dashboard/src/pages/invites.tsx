import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListInvites, useListSubAccounts, useCreateInvite, useRevokeInvite, getListInvitesQueryKey, useGetMe, getListSubAccountsQueryKey } from "@workspace/api-client-react";
import { getActiveMembership, getActiveRole } from "@/lib/roles";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { format, isPast } from "date-fns";
import { UserPlus, Search, Copy, Check, Ban, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  subAccountId: z.string().min(1, "Sub-account is required"),
  role: z.enum(["sub_account_holder", "member"]),
  accessDurationDays: z.string().optional(),
  inviteExpiresInDays: z.string().optional(),
});

export default function Invites() {
  const { data: me } = useGetMe();
  const activeRole = getActiveRole(me?.memberships);
  const isAgencyAdmin = activeRole === "agency_admin";
  const defaultSubAccountId = getActiveMembership(me?.memberships)?.subAccountId ?? undefined;

  const [subAccountFilter, setSubAccountFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: invites, isLoading: invitesLoading } = useListInvites(
    subAccountFilter !== "all" ? { subAccountId: subAccountFilter } : undefined
  );
  const { data: subAccounts } = useListSubAccounts({ query: { enabled: isAgencyAdmin, queryKey: getListSubAccountsQueryKey() } });
  
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subAccountId: defaultSubAccountId || "",
      role: "member",
      accessDurationDays: "",
      inviteExpiresInDays: "7",
    },
  });

  // For non-admins (sub_account_holders), invites are always scoped to their own
  // sub-account. `me` loads asynchronously, so sync the bound subAccountId into the
  // form once it is available; otherwise the required field stays empty and submit
  // fails silently.
  useEffect(() => {
    if (!isAgencyAdmin && defaultSubAccountId) {
      form.setValue("subAccountId", defaultSubAccountId, { shouldValidate: true });
    }
  }, [isAgencyAdmin, defaultSubAccountId, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      subAccountId: values.subAccountId,
      role: values.role,
      accessDurationDays: values.accessDurationDays ? parseInt(values.accessDurationDays) : undefined,
      inviteExpiresInDays: values.inviteExpiresInDays ? parseInt(values.inviteExpiresInDays) : undefined,
    };

    createInvite.mutate({ data: payload }, {
      onSuccess: () => {
        toast({ title: "Invite generated", description: "A new invite code has been created successfully." });
        queryClient.invalidateQueries({ queryKey: getListInvitesQueryKey() });
        setCreateDialogOpen(false);
        form.reset();
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Failed to create invite", description: err.message });
      }
    });
  };

  const handleRevoke = (id: string) => {
    revokeInvite.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Invite revoked", description: "The invite link is no longer valid." });
        queryClient.invalidateQueries({ queryKey: getListInvitesQueryKey() });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Failed to revoke", description: err.message });
      }
    });
  };

  const copyLink = (code: string, id: string) => {
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    const url = `${window.location.origin}${basePath}/redeem?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({ title: "Link copied", description: "Redeem link copied to clipboard." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredInvites = invites?.filter(i => {
    if (search && !i.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getSubAccountName = (id?: string | null) => {
    if (!id) return "Global";
    return subAccounts?.find(sa => sa.id === id)?.name || id;
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight">Invites</h1>
            <p className="text-muted-foreground mt-2">Generate and manage access links for your programs.</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <LinkIcon className="h-4 w-4 mr-2" />
                Generate Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Generate Invite Link</DialogTitle>
                <DialogDescription>
                  Create a shareable link to grant access to a program.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  {isAgencyAdmin ? (
                    <FormField
                      control={form.control}
                      name="subAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Sub-Account (Program)</Label>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a program" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subAccounts?.map(sa => (
                                <SelectItem key={sa.id} value={sa.id}>{sa.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      This invite will be created for your program.
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Granted Role</Label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isAgencyAdmin && <SelectItem value="sub_account_holder">Sub-Account Holder</SelectItem>}
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="accessDurationDays"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Access Duration (Days)</Label>
                          <FormControl>
                            <Input type="number" placeholder="Optional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="inviteExpiresInDays"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Link Expires In (Days)</Label>
                          <FormControl>
                            <Input type="number" placeholder="7" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createInvite.isPending}>
                      {createInvite.isPending ? "Generating..." : "Generate Link"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Active & History
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search code..." 
                    className="pl-9 h-9" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {isAgencyAdmin && (
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
            {invitesLoading ? (
              <div className="p-8 space-y-4">
                <div className="h-10 bg-muted/50 rounded animate-pulse"></div>
                <div className="h-10 bg-muted/50 rounded animate-pulse"></div>
                <div className="h-10 bg-muted/50 rounded animate-pulse"></div>
              </div>
            ) : filteredInvites?.length === 0 ? (
              <div className="p-12 text-center">
                <LinkIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No invites found</h3>
                <p className="text-muted-foreground mt-1">
                  Generate an invite link to grant someone access.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sub-Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvites?.map((invite) => {
                    const isExpired = invite.inviteExpiresAt && isPast(new Date(invite.inviteExpiresAt));
                    const isPending = invite.status === "pending" && !isExpired;
                    
                    return (
                      <TableRow key={invite.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-sm font-medium">{invite.code}</TableCell>
                        <TableCell className="capitalize">{invite.role.replace(/_/g, ' ')}</TableCell>
                        <TableCell className="text-muted-foreground">{getSubAccountName(invite.subAccountId)}</TableCell>
                        <TableCell>
                          {invite.status === "revoked" ? (
                            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Revoked</Badge>
                          ) : invite.status === "redeemed" ? (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">Redeemed</Badge>
                          ) : isExpired ? (
                            <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 border-orange-500/20">Expired</Badge>
                          ) : (
                            <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invite.inviteExpiresAt ? format(new Date(invite.inviteExpiresAt), "MMM d, yyyy") : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8"
                              disabled={!isPending}
                              onClick={() => copyLink(invite.code, invite.id)}
                            >
                              {copiedId === invite.id ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                              Copy Link
                            </Button>
                            {isPending && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleRevoke(invite.id)}
                                disabled={revokeInvite.isPending}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
