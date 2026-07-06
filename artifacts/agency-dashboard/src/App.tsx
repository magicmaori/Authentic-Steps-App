import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, Show, RedirectToSignIn } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import type { MembershipRole } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";

import { ClerkQueryClientCacheInvalidator } from "@/components/ClerkQueryClientCacheInvalidator";
import { RoleGate } from "@/components/RoleGate";
import HomeRedirect from "@/pages/index";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import Overview from "@/pages/overview";
import SubAccounts from "@/pages/sub-accounts";
import Members from "@/pages/members";
import Invites from "@/pages/invites";
import Redeem from "@/pages/redeem";
import LegalPage from "@/pages/legal";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const proxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ProtectedRoute({
  component: Component,
  allow,
}: {
  component: React.ComponentType;
  allow?: MembershipRole[];
}) {
  return (
    <>
      <Show when="signed-in">
        {allow ? (
          <RoleGate allow={allow}>
            <Component />
          </RoleGate>
        ) : (
          <Component />
        )}
      </Show>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/overview" component={() => <ProtectedRoute component={Overview} />} />
      <Route
        path="/sub-accounts"
        component={() => <ProtectedRoute component={SubAccounts} allow={["agency_admin"]} />}
      />
      <Route
        path="/members"
        component={() => <ProtectedRoute component={Members} allow={["agency_admin", "sub_account_holder"]} />}
      />
      <Route
        path="/invites"
        component={() => <ProtectedRoute component={Invites} allow={["agency_admin", "sub_account_holder"]} />}
      />
      <Route path="/redeem" component={Redeem} />
      <Route path="/privacy" component={() => <LegalPage />} />
      <Route path="/legal/:type" component={LegalPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function stripBase(path: string) {
  if (!basePath) return path;
  return path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();

  const routerPush = (to: string) => setLocation(stripBase(to));
  const routerReplace = (to: string) => setLocation(stripBase(to), { replace: true });

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={proxyUrl}
      routerPush={routerPush}
      routerReplace={routerReplace}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      appearance={{
        theme: theme === "dark" ? dark : undefined,
        cssLayerName: "clerk",
        variables: {
          colorPrimary: "hsl(200 70% 35%)",
          colorForeground: "hsl(215 40% 15%)",
          colorMutedForeground: "hsl(215 20% 45%)",
          colorBackground: "hsl(210 25% 99%)",
          colorInput: "hsl(210 20% 88%)",
          colorInputForeground: "hsl(215 40% 15%)",
          colorDanger: "hsl(0 70% 50%)",
          colorNeutral: "hsl(215 40% 15%)",
          fontFamily: "Plus Jakarta Sans, sans-serif",
        },
        elements: {
          cardBox: "bg-card border-card-border shadow-md",
          card: "!bg-transparent",
          footer: "!bg-transparent",
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
