import {
  formatCommercialQuantity,
  getPackageBalanceIssues,
} from "@/modules/commercial/commercial-presentation";
import type { PackageBalanceProjection } from "@/modules/packages/package-ledger";

export function PackageBalanceFacts({
  audience,
  balance,
  unitLabel,
}: {
  audience: "management" | "client";
  balance: PackageBalanceProjection;
  unitLabel: string;
}) {
  const hasIntegrityIssue =
    getPackageBalanceIssues(balance, unitLabel).length > 0;
  const items = [
    ["المتفق عليه", balance.committed],
    ["قيد العمل", balance.reserved],
    ["المسلّم", balance.consumed],
    ["المتبقي", balance.available],
  ] as const;

  return (
    <div className="grid gap-2">
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {items.map(([label, value]) => {
          const quantity = formatCommercialQuantity(value, unitLabel);
          const invalidRemaining = label === "المتبقي" && value < 0;
          const text =
            quantity.issue || invalidRemaining
              ? audience === "management"
                ? "يحتاج تصحيحًا"
                : "قيد المراجعة"
              : quantity.text;

          return (
            <div className="rounded-md bg-background px-3 py-2" key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-1 font-semibold text-foreground">{text}</dd>
            </div>
          );
        })}
      </dl>
      {hasIntegrityIssue ? (
        <p
          className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-foreground"
          role="alert"
        >
          {audience === "management"
            ? "الرصيد يحتاج تصحيحًا عبر المسار المدقق قبل الاعتماد عليه."
            : "يجري التحقق من رصيد هذه الخدمة، وسيظهر المتبقي بعد المراجعة."}
        </p>
      ) : null}
    </div>
  );
}
