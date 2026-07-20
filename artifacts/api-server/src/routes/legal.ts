import { Router } from "express";
import { PRIVACY, TERMS, type DocContent } from "@workspace/legal-content";

const router = Router();

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(doc: DocContent): string {
  const sectionsHtml = doc.sections
    .map((s) => {
      const headingHtml = s.heading
        ? `<h2>${escapeHtml(s.heading)}</h2>`
        : "";
      const bodyHtml = escapeHtml(s.body)
        .split("\n")
        .map((line) => (line.trim() === "" ? "<br>" : line))
        .join("\n");
      return `<section>${headingHtml}<p>${bodyHtml}</p></section>`;
    })
    .join("\n");

  const subtitleHtml = doc.subtitle
    ? `<p class="subtitle">${escapeHtml(doc.subtitle)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(doc.title)} — Authentic Steps For Youth</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      line-height: 1.65;
      padding: 40px 20px 80px;
    }
    .container {
      max-width: 680px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e5e5;
    }
    .brand {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #5b6af0;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #111;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 13px;
      color: #888;
    }
    section {
      margin-bottom: 28px;
    }
    h2 {
      font-size: 15px;
      font-weight: 600;
      color: #111;
      margin-bottom: 8px;
    }
    p {
      font-size: 14px;
      color: #444;
      white-space: pre-line;
    }
    footer {
      margin-top: 60px;
      padding-top: 24px;
      border-top: 1px solid #e5e5e5;
      font-size: 12px;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">Authentic Steps For Youth</div>
      <h1>${escapeHtml(doc.title)}</h1>
      ${subtitleHtml}
    </header>
    ${sectionsHtml}
    <footer>
      &copy; Authentic Steps For Youth &mdash; authenticsteps.com.au
    </footer>
  </div>
</body>
</html>`;
}

router.get("/privacy-policy", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(renderHtml(PRIVACY));
});

router.get("/terms", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(renderHtml(TERMS));
});

export default router;
