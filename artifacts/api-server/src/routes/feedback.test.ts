import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// Mutable auth state so each request can act as a different Clerk user, and a
// mutable Linear stub so each test can flip between success and failure
// without re-mocking the module. Mirrors access-flows.test.ts's authState
// pattern.
const authState = vi.hoisted(() => ({ userId: null as string | null }));
const linearState = vi.hoisted(() => ({
  behavior: "success" as "success" | "failure",
}));

vi.mock("@clerk/express", () => ({
  getAuth: (req: any) => {
    const header = req?.headers?.["x-test-user"];
    return { userId: header != null ? String(header) : authState.userId };
  },
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) =>
    next(),
  clerkClient: {
    users: {
      getUser: async (id: string) => ({
        primaryEmailAddress: { emailAddress: `${id}@example.com` },
        emailAddresses: [{ emailAddress: `${id}@example.com` }],
      }),
    },
  },
}));

// Stubs the Linear connector call itself (not the route), so the test still
// exercises the real route -> lib/linear wiring and only fakes the network
// hop to Linear's GraphQL API.
vi.mock("../lib/linear", () => ({
  createFeedbackIssue: vi.fn(async (input: { message: string }) => {
    if (linearState.behavior === "failure") {
      throw new Error("Linear API request failed with status 500");
    }
    return {
      id: "issue-uuid-1",
      identifier: "AS-123",
      url: "https://linear.app/authentic-steps/issue/AS-123",
    };
  }),
}));

const { default: app } = await import("../app");

let server: Server;
let baseUrl: string;

interface Res {
  status: number;
  body: any;
}

async function call(
  actorId: string | null,
  method: string,
  path: string,
  body?: unknown,
): Promise<Res> {
  authState.userId = actorId;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

// Submits as a distinct actor via the per-request header, so many actors can
// be exercised concurrently (needed by the rate-limit tests below) without
// stomping on the shared authState used by `call`.
async function submit(actorId: string): Promise<Res> {
  const res = await fetch(`${baseUrl}/feedback`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-user": actorId },
    body: JSON.stringify({ message: "Something broke", platform: "ios" }),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

beforeAll(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}/api`;
});

afterEach(() => {
  linearState.behavior = "success";
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

describe("POST /feedback (mobile bug reports -> Linear triage queue)", () => {
  it("rejects unauthenticated callers", async () => {
    const res = await call(null, "POST", "/feedback", {
      message: "The breathing timer froze on step 3",
    });
    expect(res.status).toBe(401);
  });

  it("rejects a missing/empty message", async () => {
    const res = await call("user_reporter_1", "POST", "/feedback", {
      message: "",
    });
    expect(res.status).toBe(400);
  });

  it("files a valid report as a Linear issue and returns its identifier/url", async () => {
    const res = await call("user_reporter_1", "POST", "/feedback", {
      message: "The breathing timer froze on step 3",
      platform: "ios",
      appVersion: "1.2.0",
      deviceInfo: "iPhone 14, iOS 17.4",
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ok: true,
      issueIdentifier: "AS-123",
      issueUrl: "https://linear.app/authentic-steps/issue/AS-123",
    });
  });

  it("returns a clear error the client can fall back on when Linear fails", async () => {
    linearState.behavior = "failure";
    const res = await call("user_reporter_1", "POST", "/feedback", {
      message: "The breathing timer froze on step 3",
    });
    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({ error: expect.any(String) });
    expect(res.body.ok).not.toBe(true);
  });
});

describe("POST /feedback rate limiting", () => {
  it("allows a handful of submissions then rejects further ones with 429", async () => {
    const actor = `user_rl_${Math.random().toString(36).slice(2, 10)}`;

    for (let i = 0; i < 5; i++) {
      const res = await submit(actor);
      expect(res.status).toBe(201);
    }

    const limited = await submit(actor);
    expect(limited.status).toBe(429);
    expect(limited.body.error).toBeTruthy();
  });

  it("rate limits independently per user", async () => {
    const actorA = `user_rl_a_${Math.random().toString(36).slice(2, 10)}`;
    const actorB = `user_rl_b_${Math.random().toString(36).slice(2, 10)}`;

    for (let i = 0; i < 5; i++) {
      expect((await submit(actorA)).status).toBe(201);
    }
    expect((await submit(actorA)).status).toBe(429);

    // A different user still has their own fresh quota.
    expect((await submit(actorB)).status).toBe(201);
  });
});
