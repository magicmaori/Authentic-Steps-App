import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListSubAccounts, useCreateSubAccount, getListSubAccountsQueryKey, useGetMe } from "@workspace/api-client-react";
import { getActiveRole } from "@/lib/roles";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Building2, Plus, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(1, "Sub-account name is required").max(100),
});

export default function SubAccounts() {
  const { data: me } = useGetMe();
  const isAgencyAdmin = getActiveRole(me?.memberships) === "agency_admin";

  const { data: subAccounts, isLoading } = useListSubAccounts({ query: { enabled: isAgencyAdmin, queryKey: getListSubAccountsQueryKey() } });
  const createSubAccount = useCreateSubAccount();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createSubAccount.mutate({ data: { name: values.name } }, {
      onSuccess: () => {
        toast({ title: "Sub-account created", description: "The sub-account has been added successfully." });
        queryClient.invalidateQueries({ queryKey: getListSubAccountsQueryKey() });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast({ 
          variant: "destructive", 
          title: "Error creating sub-account", 
          description: error.message || "An unexpected error occurred" 
        });
      }
    });
  };

  const filteredSubAccounts = subAccounts?.filter(sa => 
    sa.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight">Sub-Accounts</h1>
            <p className="text-muted-foreground mt-2">Manage program sites and teams within your agency.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            {isAgencyAdmin && (
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sub-Account
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Sub-Account</DialogTitle>
                <DialogDescription>
                  Add a new program site or team to your agency.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Name</Label>
                        <FormControl>
                          <Input placeholder="e.g. Downtown Center" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createSubAccount.isPending}>
                      {createSubAccount.isPending ? "Creating..." : "Create Sub-Account"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                All Sub-Accounts
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search sub-accounts..." 
                  className="pl-9 h-9" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                <div className="h-10 bg-muted/50 rounded animate-pulse"></div>
                <div className="h-10 bg-muted/50 rounded animate-pulse"></div>
                <div className="h-10 bg-muted/50 rounded animate-pulse"></div>
              </div>
            ) : filteredSubAccounts?.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No sub-accounts found</h3>
                <p className="text-muted-foreground mt-1">
                  {search ? "Try adjusting your search query." : "Create your first sub-account to get started."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubAccounts?.map((sa) => (
                    <TableRow key={sa.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{sa.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {sa.memberCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(sa.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
