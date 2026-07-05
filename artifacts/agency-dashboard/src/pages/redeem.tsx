import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useRedeemInvite, getGetMeQueryKey, getGetEntitlementQueryKey, getListMembersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Show, SignInButton } from "@clerk/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Ticket, CheckCircle2, LogIn } from "lucide-react";
import { UserProfileButton } from "@/components/UserProfileButton";

export default function Redeem() {
  const [location, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const redeemInvite = useRedeemInvite();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [success, setSuccess] = useState(false);
  const [redeemReturnUrl, setRedeemReturnUrl] = useState(`${basePath}/redeem`);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setCode(codeParam);
    }
    setRedeemReturnUrl(`${basePath}/redeem${window.location.search}`);
  }, [basePath]);

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    redeemInvite.mutate(
      { data: { code: code.trim() } },
      {
        onSuccess: () => {
          setSuccess(true);
          toast({ title: "Success", description: "Invite redeemed successfully. Access granted." });
          // Invalidate user queries to refresh access level
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEntitlementQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          
          // Redirect after a short delay
          setTimeout(() => setLocation("/overview"), 2000);
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Invalid Code", description: err.message || "The invite code is invalid or expired." });
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 bg-card">
        <img src={`${window.location.origin}${basePath}/logo.svg`} alt="Authentic Steps" className="h-8" />
        <UserProfileButton />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-card-border shadow-lg">
          <CardHeader className="text-center pb-8 pt-10">
            <div className="mx-auto bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mb-4">
              <Ticket className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-display">Redeem Invite</CardTitle>
            <CardDescription className="text-base mt-2">
              Enter the code provided by your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Show when="signed-out">
              <div className="py-4 text-center space-y-6">
                <p className="text-muted-foreground">
                  Sign in or create an account to redeem your invite and unlock access.
                </p>
                <SignInButton
                  mode="redirect"
                  forceRedirectUrl={redeemReturnUrl}
                  signUpForceRedirectUrl={redeemReturnUrl}
                >
                  <Button className="w-full h-12 text-base">
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign in to continue
                  </Button>
                </SignInButton>
              </div>
            </Show>
            <Show when="signed-in">
              {success ? (
                <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
                  <h3 className="text-xl font-medium text-emerald-600">Access Granted</h3>
                  <p className="text-muted-foreground">Redirecting to your dashboard...</p>
                </div>
              ) : (
                <form onSubmit={handleRedeem} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="sr-only">Invite Code</Label>
                    <Input 
                      id="code" 
                      placeholder="e.g. AUTH-1234-ABCD" 
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="h-12 text-center text-lg font-mono tracking-widest uppercase"
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base" 
                    disabled={!code.trim() || redeemInvite.isPending}
                  >
                    {redeemInvite.isPending ? "Verifying..." : "Redeem Code"}
                    {!redeemInvite.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </form>
              )}
            </Show>
          </CardContent>
          <Show when="signed-in">
            {!success && (
              <CardFooter className="flex justify-center border-t border-border/40 py-4 bg-muted/20">
                <Button variant="link" onClick={() => setLocation("/overview")} className="text-muted-foreground">
                  Cancel and return to Dashboard
                </Button>
              </CardFooter>
            )}
          </Show>
        </Card>
      </main>
    </div>
  );
}
