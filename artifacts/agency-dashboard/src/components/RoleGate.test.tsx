import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Router, useLocation } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { RoleGate } from "./RoleGate";
import { useGetMe } from "@workspace/api-client-react";
import { adminMemberships, holderMemberships, memberMemberships } from "@/test/factories";

vi.mock("@workspace/api-client-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/api-client-react")>();
  return { ...actual, useGetMe: vi.fn() };
});

const mockedUseGetMe = vi.mocked(useGetMe);

function setMe(memberships: ReturnType<typeof adminMemberships> | undefined) {
  mockedUseGetMe.mockReturnValue({
    data: memberships ? { memberships } : undefined,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useGetMe>);
}

function LocationProbe() {
  const [location] = useLocation();
  return <div data-testid="location">{location}</div>;
}

function renderGate(allow: Parameters<typeof RoleGate>[0]["allow"]) {
  const { hook } = memoryLocation({ path: "/members" });
  return render(
    <Router hook={hook}>
      <RoleGate allow={allow}>
        <div>protected content</div>
      </RoleGate>
      <LocationProbe />
    </Router>,
  );
}

describe("RoleGate access control", () => {
  beforeEach(() => {
    mockedUseGetMe.mockReset();
  });

  it("redirects a plain member away from a holder/admin-only page", () => {
    setMe(memberMemberships());
    renderGate(["agency_admin", "sub_account_holder"]);

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/overview");
  });

  it("redirects when the user has no active membership", () => {
    setMe(undefined);
    renderGate(["agency_admin", "sub_account_holder"]);

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/overview");
  });

  it("allows a sub_account_holder onto a holder-permitted page", () => {
    setMe(holderMemberships());
    renderGate(["agency_admin", "sub_account_holder"]);

    expect(screen.getByText("protected content")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/members");
  });

  it("blocks a sub_account_holder from an admin-only page", () => {
    setMe(holderMemberships());
    renderGate(["agency_admin"]);

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/overview");
  });
});
