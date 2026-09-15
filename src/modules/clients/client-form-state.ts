export type ClientFormValues = {
  name?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
};

export type ClientFormState = {
  status: "idle" | "error";
  message?: string;
  values?: ClientFormValues;
};

export const initialClientFormState: ClientFormState = {
  status: "idle",
};

export const clientFormError = ({
  message,
  values,
}: {
  message: string;
  values?: ClientFormValues;
}): ClientFormState => ({
  status: "error",
  message,
  values,
});
