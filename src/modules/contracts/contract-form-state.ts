import type { ContractStatus } from "./contract-repository";

export type ContractFormValues = {
  clientId?: string;
  name?: string;
  reference?: string;
  summary?: string;
  periodStart?: string;
  periodEnd?: string;
  status?: ContractStatus | string;
  idempotencyKey?: string;
};

export type ContractFormState =
  | { status: "idle"; values?: ContractFormValues; message?: undefined }
  | { status: "error"; values?: ContractFormValues; message: string };

export const initialContractFormState: ContractFormState = { status: "idle" };

export const contractFormError = ({
  message,
  values,
}: {
  message: string;
  values: ContractFormValues;
}): ContractFormState => ({
  status: "error",
  message,
  values,
});
