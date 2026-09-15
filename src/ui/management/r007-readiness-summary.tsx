import { buildR007OwnerReadinessSummary } from "@/modules/release/r007-readiness-boundary";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";
import { r007ReadinessCopy } from "@/ui/copy/ar-SA/r007-readiness";

function ReadinessHero() {
  return (
    <section className="grid gap-3">
      <Badge tone="accent">{r007ReadinessCopy.eyebrow}</Badge>
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold leading-tight">
          {r007ReadinessCopy.title}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-muted">
          {r007ReadinessCopy.description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/portfolio" variant="secondary">
          العودة للمساحة
        </ButtonLink>
        <ButtonLink href="/clients" variant="secondary">
          العملاء
        </ButtonLink>
      </div>
    </section>
  );
}

function ReadinessListCard({
  title,
  items,
  badge,
}: {
  title: string;
  items: readonly string[];
  badge?: string;
}) {
  return (
    <article className="grid gap-3 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {badge ? <Badge tone="warning">{badge}</Badge> : null}
      </div>
      <ul className="grid gap-2 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

export function R007ReadinessSummary() {
  const summary = buildR007OwnerReadinessSummary();

  return (
    <main className="grid gap-6">
      <ReadinessHero />

      <ReadinessListCard
        badge="تجربة داخلية فقط"
        items={r007ReadinessCopy.baselineItems}
        title={r007ReadinessCopy.baselineTitle}
      />

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">
          {r007ReadinessCopy.gatesTitle}
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summary.gates.map((gate) => {
            const copy = r007ReadinessCopy.gates[gate.area];

            return (
              <article
                className="grid gap-3 rounded-lg border border-border bg-surface p-4"
                key={gate.area}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{copy.label}</h3>
                  <Badge tone="muted">ضمن النطاق</Badge>
                </div>
                <p className="text-xs leading-5 text-muted">
                  {copy.description}
                </p>
                <p className="text-xs leading-5 text-muted">
                  أدلة مطلوبة: {gate.requiredEvidence.length}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ReadinessListCard
          items={r007ReadinessCopy.blockedItems}
          title={r007ReadinessCopy.blockedTitle}
        />
        <ReadinessListCard
          items={r007ReadinessCopy.decisions}
          title={r007ReadinessCopy.decisionsTitle}
        />
      </section>
    </main>
  );
}
