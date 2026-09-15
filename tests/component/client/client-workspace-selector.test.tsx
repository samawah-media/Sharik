import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClientWorkspaceSelector } from "@/ui/client/client-workspace-selector";

const clients = [
  { id: "client-a", name: "المساحة أ" },
  { id: "client-b", name: "المساحة ب" },
];
const assign = vi.fn();
type SelectionResult = { ok: true } | { ok: false; message: string };

beforeEach(() => {
  assign.mockReset();
  // JSDOM cannot navigate; replace only the browser navigation boundary.
  vi.stubGlobal(
    "window",
    new Proxy(window, {
      get(target, property) {
        if (property === "location") return { ...target.location, assign };
        return Reflect.get(target, property, target);
      },
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ClientWorkspaceSelector", () => {
  it("shows the current B workspace in a labelled native select", () => {
    render(
      <ClientWorkspaceSelector
        clients={clients}
        selectedClientId="client-b"
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox", { name: "اختر المساحة" })).toHaveValue(
      "client-b",
    );
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("shows a single authorized workspace name without a form", () => {
    render(
      <ClientWorkspaceSelector clients={[clients[1]]} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("المساحة ب")).toBeVisible();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing for no authorized workspaces", () => {
    const { container } = render(
      <ClientWorkspaceSelector clients={[]} onSelect={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("submits exactly B only after explicit confirmation and fully navigates home", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn().mockResolvedValue({ ok: true });
    render(
      <ClientWorkspaceSelector
        clients={clients}
        selectedClientId="client-a"
        onSelect={onSelect}
      />,
    );
    await user.selectOptions(screen.getByRole("combobox"), "client-b");
    expect(onSelect).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "فتح المساحة" }));
    await waitFor(() =>
      expect(assign).toHaveBeenCalledExactlyOnceWith("/client"),
    );
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("client-b");
  });

  it("disables selection and submission and announces pending until the result", async () => {
    const user = userEvent.setup();
    let resolve!: (result: SelectionResult) => void;
    const onSelect = vi.fn(
      () =>
        new Promise<SelectionResult>((done) => {
          resolve = done;
        }),
    );
    render(<ClientWorkspaceSelector clients={clients} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "فتح المساحة" }));
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/جار/);
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
    await act(async () => resolve({ ok: false, message: "تعذر فتح المساحة." }));
    expect(screen.getByRole("button")).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it.each(["denied", "rejected", "thrown"] as const)(
    "keeps the route and selection on %s and allows retry",
    async (failure) => {
      const user = userEvent.setup();
      const onSelect = vi.fn<() => Promise<SelectionResult>>();
      if (failure === "denied") {
        onSelect.mockResolvedValueOnce({
          ok: false,
          message: "لا يمكن فتح المساحة الآن.",
        });
      } else if (failure === "rejected") {
        onSelect.mockRejectedValueOnce(new Error("private backend details"));
      } else {
        onSelect.mockImplementationOnce(() => {
          throw new Error("private backend details");
        });
      }
      onSelect.mockResolvedValueOnce({ ok: true });
      render(
        <ClientWorkspaceSelector
          clients={clients}
          selectedClientId="client-a"
          onSelect={onSelect}
        />,
      );
      await user.selectOptions(screen.getByRole("combobox"), "client-b");
      await user.click(screen.getByRole("button", { name: "فتح المساحة" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        /[\u0600-\u06ff]/,
      );
      expect(screen.getByRole("alert")).not.toHaveTextContent(
        "private backend details",
      );
      if (failure === "denied")
        expect(screen.getByRole("alert")).toHaveTextContent(
          "لا يمكن فتح المساحة الآن.",
        );
      expect(assign).not.toHaveBeenCalled();
      expect(screen.getByRole("combobox")).toHaveValue("client-b");
      expect(screen.getByRole("combobox")).toBeEnabled();
      await user.click(screen.getByRole("button", { name: "فتح المساحة" }));
      await waitFor(() =>
        expect(assign).toHaveBeenCalledExactlyOnceWith("/client"),
      );
      expect(onSelect.mock.calls).toEqual([["client-b"], ["client-b"]]);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    },
  );

  it("updates when the selected workspace prop changes", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <ClientWorkspaceSelector
        clients={clients}
        selectedClientId="client-b"
        onSelect={onSelect}
      />,
    );
    rerender(
      <ClientWorkspaceSelector
        clients={clients}
        selectedClientId="client-a"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("client-a");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("preserves an unsubmitted choice on equivalent props but drops removed options", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn().mockResolvedValue({ ok: true });
    const { rerender } = render(
      <ClientWorkspaceSelector
        clients={clients}
        selectedClientId="client-a"
        onSelect={onSelect}
      />,
    );
    await user.selectOptions(screen.getByRole("combobox"), "client-b");
    rerender(
      <ClientWorkspaceSelector
        clients={[...clients]}
        selectedClientId="client-a"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("client-b");
    rerender(
      <ClientWorkspaceSelector
        clients={[clients[0], { id: "client-d", name: "المساحة د" }]}
        selectedClientId="client-a"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("client-a");
    await user.click(screen.getByRole("button", { name: "فتح المساحة" }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("client-a");
  });

  it("never submits a selected prop outside the supplied options", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn().mockResolvedValue({ ok: true });
    render(
      <ClientWorkspaceSelector
        clients={clients}
        selectedClientId="client-c"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("client-a");
    await user.click(screen.getByRole("button", { name: "فتح المساحة" }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("client-a");
  });
});
