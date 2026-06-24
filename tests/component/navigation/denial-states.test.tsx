import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AccessDeniedState,
  MembershipDisabledState,
  NoAssignedClientState,
  ResourceNotFoundState,
  SessionExpiredState,
} from "@/ui/shared/access-states";

describe("shared access and denial states", () => {
  it("renders a safe permission denial without tenant or client identifiers", () => {
    render(<AccessDeniedState returnHref="/portfolio" />);

    expect(
      screen.getByRole("heading", { name: "لا يمكن الوصول إلى هذه الصفحة" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "العودة للمساحة الآمنة" })).toHaveAttribute(
      "href",
      "/portfolio",
    );
    expect(screen.queryByText("Client B")).not.toBeInTheDocument();
    expect(screen.queryByText("tenant_b")).not.toBeInTheDocument();
    expect(screen.queryByText("client_b")).not.toBeInTheDocument();
  });

  it("renders not-found and no-assigned-client states without enumeration", () => {
    render(
      <>
        <ResourceNotFoundState />
        <NoAssignedClientState />
      </>,
    );

    expect(
      screen.getByRole("heading", { name: "المورد غير متاح" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "لا يوجد عملاء مسندون" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Client C")).not.toBeInTheDocument();
    expect(screen.queryByText("tenant_a")).not.toBeInTheDocument();
  });

  it("renders session and disabled membership states with clear recovery paths", () => {
    render(
      <>
        <SessionExpiredState />
        <MembershipDisabledState />
      </>,
    );

    expect(
      screen.getByRole("heading", { name: "انتهت الجلسة" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "تم تعطيل العضوية" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "تسجيل الدخول" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });
});
