import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email("أدخل بريدًا إلكترونيًا صحيحًا."),
  password: z.string().min(1, "أدخل كلمة المرور."),
});

export type SignInInput = z.infer<typeof signInSchema>;

export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  if (value.includes("://")) {
    return "/";
  }

  return value;
}

export function getSafeAuthErrorMessage(errorCode?: string) {
  if (errorCode === "invalid_credentials") {
    return "البريد أو كلمة المرور غير صحيحة.";
  }

  return "تعذر تسجيل الدخول الآن. حاول مرة أخرى.";
}
