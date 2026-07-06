import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import Overview from "./overview";
import {
  useGetMe,
  useGetEntitlement,
  useListSubAccounts,
  useListMembers,
  useListInvites,
} from "@workspace/api-client-react";
import { memberMemberships, adminMemberships } from "@/test/factories";

vi.mock("@workspace/api-client-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/api-client-react")>();
  return {
    ...actual,
    useGetMe: vi.fn(),
    useGetEntitlement: vi.fn(),
    useListSubAccounts: vi.fn(),
    useListMembers: vi.fn(),
    useListInvites: vi.fn(),
  };
});

vi.mock("@/components/UserProfileButton", () => ({
  UserProfileButton: () => null,
}));

const mockedUseGetMe = vi.mocked(useGetMe);
const mockedUseGetEntitlement = vi.mocked(useGetEntitlement);
const mockedUseListSubAccounts = vi.mocked(useListSubAccounts);
const mockedUseListMembers = vi.mocked(useListMembers);
const mockedUseListInvites = vi.mocked(useListInvites);

function setupHooks(memberships: ReturnType<typeof memberMemberships>) {
  mockedUseGetMe.mockReturnValue({ data: { memberships }, isLoading: false } as unknown as ReturnType<typeof useGetMe>);
  mockedUseGetEntitlement.mockReturnValue({
    data: { active: true, reason: "active", role: "member" },
    isLoading: false,
  } as unknown as ReturnType<typeof useGetEntitlement>);
  mockedUseListSubAccounts.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useListSubAccounts>);
  mockedUseListMembers.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useListMembers>);
  mockedUseListInvites.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useListInvites>);
}

function renderOverview() {
  const { hook } = memoryLocation({ path: "/overview" });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Router hook={hook}>
        <Overview />
      </Router>
    </QueryClientProvider>,
  );
}

describe("Overview page points members to the mobile app", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows mobile-app messaging on the member view", () => {
    setupHooks(memberMemberships());
    renderOverview();

    expect(screen.getByText(/authentic steps lives in the mobile app/i)).toBeInTheDocument();
    expect(screen.getByText(/use the authentic steps/i)).toBeInTheDocument();
  });

  it("does not show the mobile-app messaging on the admin management view", () => {
    setupHooks(adminMemberships());
    renderOverview();

    expect(screen.queryByText(/authentic steps lives in the mobile app/i)).not.toBeInTheDocument();
  });
});
