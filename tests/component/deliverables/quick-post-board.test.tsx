import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { DeliverableBoard } from "@/ui/management/deliverable-board";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

it("adds a post from an empty board using only a title", async () => {
  const action = vi
    .fn<(data: FormData) => Promise<{ ok: true; deliverableId: string }>>()
    .mockResolvedValue({ ok: true, deliverableId: "post_a" });
  render(
    <DeliverableBoard
      deliverables={[]}
      quickPost={{
        action,
        lines: [{ id: "line_a", label: "منشورات", available: 2 }],
        members: [],
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "+ منشور جديد" }));
  fireEvent.change(screen.getByRole("textbox", { name: "عنوان المنشور" }), {
    target: { value: "منشور اليوم الوطني" },
  });
  expect(screen.queryByRole("combobox", { name: "بند المنشورات" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "إضافة" }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  expect(Object.fromEntries(action.mock.calls[0][0])).toMatchObject({
    name: "منشور اليوم الوطني",
    packageLineId: "line_a",
  });
  expect(await screen.findByText("تمت إضافة المنشور.")).toBeInTheDocument();
});
