import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("application shell", () => {
  it("renders the Arabic foundation shell", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "منصة سماوة" }),
    ).toBeInTheDocument();
    expect(screen.getByText("واجهة عربية RTL")).toBeInTheDocument();
  });
});
