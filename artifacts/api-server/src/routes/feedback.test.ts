import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/express", () => ({
  getAuth: (req: any) => ({
    userId: req?.headers?.["x-test-user"] ?? null,
  }),
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

vi.mock("../lib/linear", () => ({
  createFeedbackIssue: async () => ({
    identifier: "TEST-1",
    url: "https://linear.app/test/issue/TEST-1",
  }),
}));

const { default: app } = await import("../app");

let server: Server;
let baseUrl: string;

async function submit(actorId: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${baseUrl}/api/feedback`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-user": actorId },
    body: JSON.stringify({ message: "Something broke", platform: "ios" }),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(() => {
  server.close();
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
