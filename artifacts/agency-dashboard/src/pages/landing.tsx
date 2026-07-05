import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40">
        <img src={`${window.location.origin}${basePath}/logo.svg`} alt="Authentic Steps" className="h-10" />
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
          <Link href="/sign-up" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Sign Up</Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold tracking-tight text-foreground mb-6 font-display">
          Empowering Agency Management
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          The back-office console for Authentic Steps. Steward access for your programs, manage team permissions, and issue invites with clarity and confidence.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/sign-up" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            Get Started
          </Link>
          <Link href="/sign-in" className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}
