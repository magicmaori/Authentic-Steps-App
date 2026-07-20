import { Router } from "express";

const router = Router();

// NOTE: The privacy policy and terms text below is duplicated from
// artifacts/authentic-steps/app/legal.tsx. If the policy text changes,
// both copies must be updated.

interface Section {
  heading?: string;
  body: string;
}

interface DocContent {
  title: string;
  subtitle?: string;
  sections: Section[];
}

const PRIVACY: DocContent = {
  title: "Privacy Policy",
  subtitle: "Effective 27 June 2026 · Authentic Steps For Youth",
  sections: [
    {
      heading: "The short version",
      body: "We do not collect any personal information about you. Everything you write in this app stays on your device. We have no servers holding your data.",
    },
    {
      heading: "What information we collect",
      body: "Authentic Steps For Youth does not collect, store, or transmit any personal information. The app:\n\n· Does not require an account, name, email address, or phone number\n· Automatically assigns you a randomly generated anonymous username (e.g. \"CopperFox\") — stored only on your device, never sent to us\n· Does not track your location\n· Does not use advertising networks or analytics services that identify you\n· Does not share any data with third parties",
    },
    {
      heading: "What is stored on your device",
      body: "All data you create — daily ritual entries, gratitude notes, intentions, I Am statements, journal entries, streak counts, and grounding sessions — is stored locally on your device only using your phone's private storage. It never leaves your device unless you choose to export or share it yourself.\n\nYour Recovery Code contains only your own journal and streak data in an encoded format. This code is never sent to our servers. Only you hold it.",
    },
    {
      heading: "Young people and children",
      body: "This app is designed for young people. We have deliberately built it to collect no personal information so that young users can engage safely without privacy risk. We encourage parents and carers to be aware of the app's content and to support young people in using it.",
    },
    {
      heading: "Australian Privacy Act",
      body: "Under the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs), \"personal information\" means information that identifies, or could reasonably identify, an individual. Because we do not collect such information, the APPs do not apply to our operations in relation to this app. We are nonetheless committed to privacy-by-design and keeping your experience safe and anonymous.",
    },
    {
      heading: "Data security",
      body: "Because all your data is stored locally on your device, its security depends on your device's own security settings (e.g. screen lock, biometrics). We recommend keeping your device locked and your Recovery Code stored somewhere safe — such as a password manager or secure notes app.",
    },
    {
      heading: "Changes to this policy",
      body: "If we update this policy, the new version will appear in the app. Continued use of the app after an update means you accept the revised policy.",
    },
    {
      heading: "Contact us",
      body: "Questions about this privacy policy?\nhello@authenticsteps.com.au\nauthenticsteps.com.au",
    },
  ],
};

const TERMS: DocContent = {
  title: "Terms of Service",
  subtitle: "Effective 27 June 2026",
  sections: [
    {
      heading: "About this app",
      body: "Authentic Steps For Youth is a free wellbeing app designed for young people. It provides tools for daily rituals, journaling, breathing exercises, grounding techniques, and community encouragement.",
    },
    {
      heading: "Not a substitute for professional support",
      body: "This app is a general wellbeing tool only. It is not a medical device, a mental health treatment, or a crisis service. It does not provide clinical advice, diagnosis, or therapy.\n\nIf you are experiencing a mental health crisis, please contact a crisis support service (see the Support tab) or speak with a trusted adult, doctor, or mental health professional.",
    },
    {
      heading: "Who can use this app",
      body: "This app is intended for young people and their supporters. There is no minimum age requirement, but users under 13 are encouraged to use the app with parental guidance.",
    },
    {
      heading: "Your data and your device",
      body: "All content you enter — including journal entries, gratitude notes, and intentions — is stored privately on your device. You are responsible for keeping your device secure and for saving your Recovery Code if you wish to retain your data across devices or reinstalls.",
    },
    {
      heading: "Acceptable use",
      body: "You agree to use the app for your personal wellbeing only. You must not attempt to reverse-engineer, copy, distribute, or misuse the app or its content.",
    },
    {
      heading: "Community features",
      body: "Community encouragement features are anonymous. You agree to send only positive, supportive messages. Content that is harmful, harassing, or inappropriate is not permitted.",
    },
    {
      heading: "Intellectual property",
      body: "All original content in this app — including written exercises, affirmations, and design — is owned by Authentic Steps For Youth and is protected by Australian copyright law. You may not reproduce or distribute app content without written permission.",
    },
    {
      heading: "Disclaimer",
      body: "The app is provided \"as is\" without warranties of any kind. To the extent permitted by Australian Consumer Law, Authentic Steps For Youth is not liable for any loss or damage arising from your use of the app.",
    },
    {
      heading: "Governing law",
      body: "These terms are governed by the laws of the State of Queensland, Australia.",
    },
    {
      heading: "Contact",
      body: "Questions about these terms?\nhello@authenticsteps.com.au\nauthenticsteps.com.au",
    },
  ],
};

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
