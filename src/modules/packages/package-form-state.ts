import type { PackageStatus } from "./package-repository";

export type PackageFormValues = {
  clientId?: string;
  contractId?: string;
  name?: string;
  periodStart?: string;
  periodEnd?: string;
  status?: PackageStatus | string;
  lineServiceLabel?: string;
  lineDeliverableTypeHint?: string;
  lineUnitLabel?: string;
  lineCommittedQuantity?: string;
  idempotencyKey?: string;
};

export type PackageFormState =
  | { status: "idle"; values?: PackageFormValues; message?: undefined }
  | { status: "error"; values?: PackageFormValues; message: string };

export const initialPackageFormState: PackageFormState = { status: "idle" };

export const packageFormError = ({
  message,
  values,
}: {
  message: string;
  values: PackageFormValues;
}): PackageFormState => ({
  status: "error",
  message,
  values,
});
