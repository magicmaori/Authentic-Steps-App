import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AppLayout } from "./AppLayout";
import { useGetMe } from "@workspace/api-client-react";
import { adminMemberships, holderMemberships, memberMemberships } from "@/test/factories";

vi.mock("@workspace/api-client-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/api-client-react")>();
  return { ...actual, useGetMe: vi.fn() };
});

vi.mock("@/components/UserProfileButton", () => ({
  UserProfileButton: () => null,
}));

const mockedUseGetMe = vi.mocked(useGetMe);

function setMe(memberships: ReturnType<typeof adminMemberships> | undefined) {
  mockedUseGetMe.mockReturnValue({
    data: memberships ? { memberships } : undefined,
  } as unknown as ReturnType<typeof useGetMe>);
}

function renderLayout() {
  const { hook } = memoryLocation({ path: "/overview" });
  return render(
    <Router hook={hook}>
      <AppLayout>
        <div>content</div>
      </AppLayout>
    </Router>,
  );
}

function navLabels(): string[] {
  const nav = document.querySelector("nav");
  if (!nav) return [];
  return within(nav)
    .getAllByRole("link")
    .map((el) => el.textContent?.trim() ?? "");
}

describe("AppLayout nav gating", () => {
  beforeEach(() => {
    mockedUseGetMe.mockReset();
  });

  it("shows Overview, Members and Invites but NOT Sub-Accounts for a sub_account_holder", () => {
    setMe(holderMemberships());
    renderLayout();

    const labels = navLabels();
    expect(labels).toContain("Overview");
    expect(labels).toContain("Members");
    expect(labels).toContain("Invites");
    expect(labels).not.toContain("Sub-Accounts");
  });

  it("shows Sub-Accounts for an agency_admin", () => {
    setMe(adminMemberships());
    renderLayout();

    const labels = navLabels();
    expect(labels).toContain("Overview");
    expect(labels).toContain("Sub-Accounts");
    expect(labels).toContain("Members");
    expect(labels).toContain("Invites");
  });

  it("shows only Overview for a plain member", () => {
    setMe(memberMemberships());
    renderLayout();

    const labels = navLabels();
    expect(labels).toEqual(["Overview"]);
    expect(labels).not.toContain("Members");
    expect(labels).not.toContain("Invites");
    expect(labels).not.toContain("Sub-Accounts");
  });
});
