import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionChangeNotice } from "@/ui/auth/session-change-notice";

type AuthListener = (
  event: string,
  session: { user?: { id: string } | null } | null,
) => void;

// Mock only the external Supabase browser auth boundary with a controllable
// listener registry; the notice logic itself stays real.
const { authListeners, runtimeControls, createSupabaseBrowserClient } =
  vi.hoisted(() => {
    const authListeners: Array<
      (event: string, session: { user?: { id: string } | null } | null) => void
    > = [];
    const unsubscribe = vi.fn();
    const runtimeControls = {
      unavailable: false,
    };
    const createSupabaseBrowserClient = () => {
      if (runtimeControls.unavailable) {
        throw new Error("Supabase public environment is not configured.");
      }
      return {
        auth: {
          onAuthStateChange: (listener: AuthListener) => {
            authListeners.push(listener);
            return { data: { subscription: { unsubscribe } } };
          },
        },
      };
    };
    return { authListeners, runtimeControls, createSupabaseBrowserClient };
  });

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient,
}));

const noticeCopy =
  "تغيّر الحساب في تبويب ثاني. حدّث الصفحة عشان تكمل بالحساب الصحيح.";
const actionCopy = "تحديث الصفحة";

const reload = vi.fn();

beforeEach(() => {
  reload.mockReset();
  // JSDOM cannot navigate; replace only the browser navigation boundary
  // (same repo precedent as the client workspace selector tests).
  vi.stubGlobal(
    "window",
    new Proxy(window, {
      get(target, property) {
        if (property === "location") {
          return { ...target.location, reload };
        }
        return Reflect.get(target, property, target);
      },
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  authListeners.length = 0;
  runtimeControls.unavailable = false;
});

const emit = async (
  event: string,
  session: { user?: { id: string } | null } | null,
) => {
  await act(async () => {
    for (const listener of [...authListeners]) {
      listener(event, session);
    }
  });
};

const sessionFor = (userId: string | null) =>
  userId ? { user: { id: userId } } : null;

describe("SessionChangeNotice", () => {
  it("renders the approved Saudi notice and action only after the account changes, without exposing account ids", async () => {
    // Break caught: a stale tab would keep operating on the previous team
    // account silently after a sign-in elsewhere.
    const { container } = render(<SessionChangeNotice />);

    await emit("INITIAL_SESSION", sessionFor("auth-user-initial"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await emit("SIGNED_IN", sessionFor("auth-user-second"));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(noticeCopy);
    expect(screen.getByRole("button", { name: actionCopy })).toBeVisible();

    expect(container.innerHTML).not.toContain("auth-user-initial");
    expect(container.innerHTML).not.toContain("auth-user-second");
  });

  it("warns when the account is removed by a sign-out in another tab", async () => {
    const { container } = render(<SessionChangeNotice />);

    await emit("INITIAL_SESSION", sessionFor("auth-user-initial"));
    await emit("SIGNED_OUT", null);

    expect(screen.getByRole("alert")).toHaveTextContent(noticeCopy);
    expect(container.innerHTML).not.toContain("auth-user-initial");
  });

  it("ignores the initial auth callback and later same-account events", async () => {
    // Break caught: warning on the initial session or harmless token
    // refreshes would produce a false stale-tab warning.
    const { container } = render(<SessionChangeNotice />);

    await emit("INITIAL_SESSION", sessionFor("auth-user-initial"));
    await emit("TOKEN_REFRESHED", sessionFor("auth-user-initial"));
    await emit("USER_UPDATED", sessionFor("auth-user-initial"));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain("auth-user-initial");
  });

  it("reloads the full page when the refresh action is used", async () => {
    // Break caught: a soft client-side refresh would keep serving the stale
    // server authorization decision for the previous account.
    const user = userEvent.setup();
    render(<SessionChangeNotice />);

    await emit("INITIAL_SESSION", sessionFor("auth-user-initial"));
    await emit("SIGNED_IN", sessionFor("auth-user-second"));

    await user.click(screen.getByRole("button", { name: actionCopy }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("fails quietly without a false warning when public Supabase runtime configuration is unavailable", () => {
    runtimeControls.unavailable = true;

    const { container } = render(<SessionChangeNotice />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
