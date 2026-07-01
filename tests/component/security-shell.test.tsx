import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AuthLayout from "@/app/(auth)/layout";
import ManagementLayout from "@/app/(management)/layout";

describe("safe auth and management shells", () => {
  it("renders auth entry RTL without privileged navigation", () => {
    render(
      <AuthLayout>
        <main>sign in</main>
      </AuthLayout>,
    );

    const shell = screen.getByText("sign in").closest("section");
    expect(shell).toHaveAttribute("dir", "rtl");
    expect(shell).toHaveAttribute("data-security-scope", "auth-entry");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("renders management entry RTL with the safe product shell navigation", () => {
    render(
      <ManagementLayout>
        <main>management</main>
      </ManagementLayout>,
    );

    const shell = screen.getByText("management").closest("section");
    expect(shell).toHaveAttribute("dir", "rtl");
    expect(shell).toHaveAttribute("data-security-scope", "management-entry");
    expect(
      screen.getByRole("navigation", { name: "تنقل الإدارة" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("client_b")).not.toBeInTheDocument();
  });
});
