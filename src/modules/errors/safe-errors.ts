export type SafeErrorCode =
  | "AUTH_REQUIRED"
  | "ACCESS_DENIED"
  | "MEMBERSHIP_DISABLED"
  | "AUDIT_EVENT_REQUIRED";

export type UnsafeErrorInput = {
  code: SafeErrorCode;
  exposeResource: false;
  internalReason?: string;
};

export type PublicSafeError = {
  code: SafeErrorCode;
  status: 401 | 403 | 404 | 500;
  copyKey: keyof typeof SAFE_ERROR_COPY;
};

export const SAFE_ERROR_COPY = {
  "errors.authRequired": "signInRequired",
  "errors.permissionDenied": "permissionDenied",
  "errors.membershipDisabled": "membershipDisabled",
  "errors.systemClosed": "systemClosed",
} as const;

export const safeDeniedError = (
  code: SafeErrorCode = "ACCESS_DENIED",
): UnsafeErrorInput => ({
  code,
  exposeResource: false,
});

export const mapSafeError = (input: UnsafeErrorInput): PublicSafeError => {
  if (input.code === "AUTH_REQUIRED") {
    return {
      code: input.code,
      status: 401,
      copyKey: "errors.authRequired",
    };
  }

  if (input.code === "MEMBERSHIP_DISABLED") {
    return {
      code: input.code,
      status: 403,
      copyKey: "errors.membershipDisabled",
    };
  }

  if (input.code === "AUDIT_EVENT_REQUIRED") {
    return {
      code: input.code,
      status: 500,
      copyKey: "errors.systemClosed",
    };
  }

  return {
    code: input.code,
    status: 404,
    copyKey: "errors.permissionDenied",
  };
};

export class SafeAuthorizationError extends Error {
  readonly safeError: UnsafeErrorInput;

  constructor(safeError: UnsafeErrorInput) {
    super(safeError.code);
    this.name = "SafeAuthorizationError";
    this.safeError = safeError;
  }
}
