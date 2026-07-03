import type { ClientRecord } from "@/modules/clients/client-repository";
import { ButtonLink } from "@/ui/core/button";

export function AssignedClients({
  clients,
}: {
  clients: Pick<ClientRecord, "id" | "name">[];
}) {
  if (clients.length === 0) {
    return (
      <section
        aria-label="حالة عدم وجود عملاء مسندين"
        className="rounded-lg border border-dashed border-border p-6"
      >
        <h2 className="text-lg font-semibold">لا يوجد عملاء مسندون</h2>
        <p className="mt-2 text-sm text-muted">
          ستظهر هنا العملاء الذين تم إسنادهم لك بعد قبول الدعوة.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="عملائي المسندون" className="grid gap-3">
      {clients.map((client) => (
        <article
          className="grid gap-4 rounded-lg border border-border p-4"
          key={client.id}
        >
          <div>
            <h2 className="text-base font-semibold">{client.name}</h2>
            <p className="mt-1 text-sm text-muted">
              عميل داخل نطاق صلاحياتك. ابدأ من صفحة العميل أو افتح المخرجات
              مباشرة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/clients/${client.id}`} size="sm" variant="primary">
              عرض العميل
            </ButtonLink>
            <ButtonLink
              href={`/clients/${client.id}/deliverables`}
              size="sm"
              variant="secondary"
            >
              المخرجات
            </ButtonLink>
            <ButtonLink
              href={`/clients/${client.id}/commercial`}
              size="sm"
              variant="secondary"
            >
              ملخص المتابعة
            </ButtonLink>
          </div>
        </article>
      ))}
    </section>
  );
}
