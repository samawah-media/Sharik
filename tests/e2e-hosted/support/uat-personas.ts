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
  await page.getByLabel("كلمة المرور").fill(persona.password);
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page.getByRole("main")).toBeVisible();
};

export const expectNoSensitiveLeakage = async (page: Page) => {
  await expect(page.getByText(/service[_-]?role/i)).toHaveCount(0);
  await expect(page.getByText(/SUPABASE_SERVICE_ROLE_KEY/)).toHaveCount(0);
  await expect(page.getByText(/tenant_[a-z0-9_-]+/i)).toHaveCount(0);
  await expect(page.getByText(/client_[a-z0-9_-]+/i)).toHaveCount(0);
};
