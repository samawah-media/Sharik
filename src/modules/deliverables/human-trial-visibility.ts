const hostedLifecyclePrefix = "s015-hosted-lifecycle-";
const hostedContractReferencePrefix = "S015-UAT-";

export function isHumanTrialDeliverable(input: {
  import_run_id?: string | null;
  idempotency_key?: string | null;
  name?: string | null;
  source_metadata?: unknown;
}) {
  const markers = [
    input.import_run_id,
    input.idempotency_key,
    input.name,
    JSON.stringify(input.source_metadata ?? {}),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase("en");

  return !(
    markers.includes(hostedLifecyclePrefix) ||
    markers.includes("negative-control") ||
    markers.includes("negative_control") ||
    /\b(alpha|beta)\b/.test(markers) ||
    markers.includes("s015 persistent")
  );
}

export function isHumanTrialContract(input: { reference?: string | null }) {
  return !input.reference?.startsWith(hostedContractReferencePrefix);
}
