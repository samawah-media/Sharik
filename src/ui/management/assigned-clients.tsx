import type { ClientRecord } from "@/modules/clients/client-repository";

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
          className="rounded-lg border border-border p-4"
          key={client.id}
        >
          <h2 className="text-base font-semibold">{client.name}</h2>
          <p className="mt-1 text-sm text-muted">داخل نطاق صلاحياتك</p>
        </article>
      ))}
    </section>
  );
}
