import { useParams, Link } from "wouter";
import { LEGAL_DOCS, type DocType } from "@/lib/legal-content";

export default function LegalPage() {
  const { type } = useParams<{ type?: string }>();
  const doc = LEGAL_DOCS[(type as DocType)] ?? LEGAL_DOCS.privacy;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="px-6 py-4 border-b border-border/40">
        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
          &larr; Authentic Steps
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 font-display">
          {doc.title}
        </h1>
        {doc.subtitle ? (
          <p className="text-sm text-muted-foreground mb-8">{doc.subtitle}</p>
        ) : null}

        <div className="flex flex-col gap-8">
          {doc.sections.map((section, i) => (
            <div key={i}>
              {section.heading ? (
                <h2 className="text-base font-semibold text-foreground mb-2">
                  {section.heading}
                </h2>
              ) : null}
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.body}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
