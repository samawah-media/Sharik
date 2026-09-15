import { expect, type Page } from "@playwright/test";

export type HostedPersonaKey =
  | "ADMIN"
  | "ACCOUNT_MANAGER"
  | "CONTENT_WRITER"
  | "DESIGNER"
  | "UNASSIGNED"
  | "CLIENT_APPROVER"
  | "CLIENT_VIEWER";

export type HostedPersona = {
  label: string;
  email: string;
  password: string;
};

const required = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Hosted UAT secure env is missing ${key}.`);
  }
  return value;
};

export const hostedPersona = (key: HostedPersonaKey): HostedPersona => ({
  label: required(`S015_${key}_LABEL`),
  email: required(`S015_${key}_EMAIL`),
  password: required(`S015_${key}_PASSWORD`),
});

export const signInHostedPersona = async (
  page: Page,
  persona: HostedPersona,
) => {
  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  await page.getByLabel("البريد الإلكتروني").fill(persona.email);
  await page.getByRole("textbox", { name: "كلمة المرور" }).fill(persona.password);
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/u, { timeout: 30_000 });
};

export const expectNoSensitiveLeakage = async (page: Page) => {
  await expect(page.getByText(/service[_-]?role/i)).toHaveCount(0);
  await expect(page.getByText(/SUPABASE_SERVICE_ROLE_KEY/)).toHaveCount(0);
  await expect(page.getByText(/^tenant_[a-z0-9_-]+$/i)).toHaveCount(0);
  await expect(page.getByText(/^client_[a-z0-9_-]+$/i)).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    /[\u00c2\u00c3\u00d8\u00d9\ufffd]/u,
  );
  await expect(page.locator("body")).not.toContainText(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
  );
};
