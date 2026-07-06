import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Invites from "./invites";
import {
  useGetMe,
  useListInvites,
  useListSubAccounts,
  useCreateInvite,
  useRevokeInvite,
  useResendInvite,
} from "@workspace/api-client-react";
import { adminMemberships, holderMemberships } from "@/test/factories";

vi.mock("@workspace/api-client-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/api-client-react")>();
  return {
    ...actual,
    useGetMe: vi.fn(),
    useListInvites: vi.fn(),
    useListSubAccounts: vi.fn(),
    useCreateInvite: vi.fn(),
    useRevokeInvite: vi.fn(),
    useResendInvite: vi.fn(),
  };
});

vi.mock("@/components/UserProfileButton", () => ({
  UserProfileButton: () => null,
}));

const mockedUseGetMe = vi.mocked(useGetMe);
const mockedUseListInvites = vi.mocked(useListInvites);
const mockedUseListSubAccounts = vi.mocked(useListSubAccounts);
const mockedUseCreateInvite = vi.mocked(useCreateInvite);
const mockedUseRevokeInvite = vi.mocked(useRevokeInvite);
const mockedUseResendInvite = vi.mocked(useResendInvite);

function idleMutation<T>(): T {
  return { mutate: vi.fn(), isPending: false } as unknown as T;
}

function setupHooks(memberships: ReturnType<typeof holderMemberships>) {
  mockedUseGetMe.mockReturnValue({ data: { memberships } } as unknown as ReturnType<typeof useGetMe>);
  mockedUseListInvites.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useListInvites>);
  mockedUseListSubAccounts.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useListSubAccounts>);
  mockedUseCreateInvite.mockReturnValue(idleMutation<ReturnType<typeof useCreateInvite>>());
  mockedUseRevokeInvite.mockReturnValue(idleMutation<ReturnType<typeof useRevokeInvite>>());
  mockedUseResendInvite.mockReturnValue(idleMutation<ReturnType<typeof useResendInvite>>());
}

function renderInvites() {
  const { hook } = memoryLocation({ path: "/invites" });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Router hook={hook}>
        <Invites />
      </Router>
    </QueryClientProvider>,
  );
}

async function openGenerateDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /generate invite/i }));
  return await screen.findByRole("dialog");
}

describe("Invites copy link is role-aware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function spyOnClipboard(user: ReturnType<typeof userEvent.setup>) {
    // userEvent.setup() installs its own navigator.clipboard stub, so the spy
    // must be attached after setup() runs, not in a shared beforeEach.
    void user;
    return vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  }

  it("copies a bare root link (mobile app) for a member invite", async () => {
    setupHooks(adminMemberships());
    mockedUseListInvites.mockReturnValue({
      data: [
        {
          id: "invite-member-1",
          code: "MEMBERCODE1",
          role: "member",
          subAccountId: "sub-1",
          status: "pending",
          email: null,
          emailSentAt: null,
          inviteExpiresAt: null,
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useListInvites>);
    const user = userEvent.setup();
    const writeText = spyOnClipboard(user);
    renderInvites();

    await user.click(await screen.findByRole("button", { name: /copy link/i }));

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/?code=MEMBERCODE1`,
    );
  });

  it("copies the dashboard /redeem link for a sub-account holder invite", async () => {
    setupHooks(adminMemberships());
    mockedUseListInvites.mockReturnValue({
      data: [
        {
          id: "invite-holder-1",
          code: "HOLDERCODE1",
          role: "sub_account_holder",
          subAccountId: "sub-1",
          status: "pending",
          email: null,
          emailSentAt: null,
          inviteExpiresAt: null,
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useListInvites>);
    const user = userEvent.setup();
    const writeText = spyOnClipboard(user);
    renderInvites();

    await user.click(await screen.findByRole("button", { name: /copy link/i }));

    const [[copiedUrl]] = writeText.mock.calls;
    expect(copiedUrl).toContain("/redeem?code=HOLDERCODE1");
    expect(copiedUrl).not.toMatch(/\/\?code=/);
  });
});

describe("Invites generate dialog role scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the program-scoped note and hides the Sub-Account selector for a holder", async () => {
    setupHooks(holderMemberships());
    const user = userEvent.setup();
    renderInvites();

    const dialog = await openGenerateDialog(user);

    expect(
      within(dialog).getByText(/this invite will be created for your program/i),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/sub-account \(program\)/i)).not.toBeInTheDocument();
  });

  it("does not offer the Sub-Account Holder role option to a holder", async () => {
    setupHooks(holderMemberships());
    const user = userEvent.setup();
    renderInvites();

    const dialog = await openGenerateDialog(user);

    const roleTrigger = within(dialog).getByRole("combobox");
    await user.click(roleTrigger);

    const options = await screen.findAllByRole("option");
    const optionLabels = options.map((o) => o.textContent?.trim());
    expect(optionLabels).toContain("Member");
    expect(optionLabels).not.toContain("Sub-Account Holder");
  });

  it("offers the Sub-Account Holder role option to an agency admin", async () => {
    setupHooks(adminMemberships());
    const user = userEvent.setup();
    renderInvites();

    const dialog = await openGenerateDialog(user);

    // Admin sees the program picker (first combobox) + role picker (second).
    const comboboxes = within(dialog).getAllByRole("combobox");
    const roleTrigger = comboboxes[comboboxes.length - 1];
    await user.click(roleTrigger);

    const options = await screen.findAllByRole("option");
    const optionLabels = options.map((o) => o.textContent?.trim());
    expect(optionLabels).toContain("Sub-Account Holder");
    expect(optionLabels).toContain("Member");
  });
});
