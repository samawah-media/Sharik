import {
  buildR008InternalGateReview,
  buildR008OwnerDecisionEvidence,
} from "@/modules/release/r008-pilot-gates";
import {
  buildR008SecurityChecklist,
  summarizeR008SecurityChecklist,
} from "@/modules/release/r008-security-checklist";
import {
  buildR008RollbackPlan,
  validateR008RollbackPlan,
} from "@/modules/release/r008-rollback-plan";
import { Badge } from "@/ui/core/badge";
import { ButtonLink } from "@/ui/core/button";
import { r008ReadinessCopy } from "@/ui/copy/ar-SA/r008-readiness";

function badgeToneFor(status: string) {
  if (status === "passed" || status === "allowed") {
    return "success" as const;
  }

  if (status === "in_progress" || status === "owner_approval_required") {
    return "warning" as const;
  }

  return "danger" as const;
}

function R008ReadinessHero() {
  return (
    <section className="grid gap-3">
      <Badge tone="accent">{r008ReadinessCopy.eyebrow}</Badge>
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold leading-tight">
          {r008ReadinessCopy.title}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-muted">
          {r008ReadinessCopy.description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/portfolio" variant="secondary">
          العودة للمساحة
        </ButtonLink>
        <ButtonLink href="/readiness/r007" variant="secondary">
          R-007
        </ButtonLink>
      </div>
    </section>
  );
}

function R008ListCard({
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

export function R008GateSummary() {
  const review = buildR008InternalGateReview();
  const ownerEvidence = buildR008OwnerDecisionEvidence();
  const securitySummary = summarizeR008SecurityChecklist(
    buildR008SecurityChecklist(),
  );
  const rollbackValidation = validateR008RollbackPlan(buildR008RollbackPlan());

  return (
    <main className="grid gap-6">
      <R008ReadinessHero />

      <R008ListCard
        badge="محلي فقط"
        items={r008ReadinessCopy.baselineItems}
        title={r008ReadinessCopy.baselineTitle}
      />

      <section
        className="grid gap-4 md:grid-cols-2"
        data-testid="r008-management-readiness"
      >
        <R008ListCard
          badge={
            securitySummary.productionCandidateReady
              ? "جاهز"
              : "يتطلب قرار مالك"
          }
          items={[
            `ضوابط مكتملة: ${securitySummary.passedCount}`,
            `ضوابط محجوبة: ${securitySummary.blockedCount}`,
            `مخاطر متبقية: ${securitySummary.residualRiskCount}`,
            "قبول الإنتاج غير ممنوح.",
          ]}
          title="جاهزية الأمن"
        />
        <R008ListCard
          badge={rollbackValidation.complete ? "مكتمل" : "ناقص"}
          items={[
            `مناطق ناقصة: ${rollbackValidation.missingAreas.length}`,
            `مناطق غير مكتملة: ${rollbackValidation.incompleteAreas.length}`,
            "أي مسار مستضاف يحتاج موافقة مالك لاحقة.",
          ]}
          title="خطة التراجع"
        />
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {r008ReadinessCopy.gatesTitle}
          </h2>
          <Badge tone="muted">
            {review.blockedGateCount} بوابات تحتاج قرارًا أو تبقى محجوبة
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {review.gates.map((gate) => {
            const copy = r008ReadinessCopy.gates[gate.area];

            return (
              <article
                className="grid gap-3 rounded-lg border border-border bg-surface p-4"
                key={gate.area}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{copy.label}</h3>
                  <Badge tone={badgeToneFor(gate.status)}>
                    {r008ReadinessCopy.gateStatus[gate.status]}
                  </Badge>
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
        <R008ListCard
          items={r008ReadinessCopy.blockedItems}
          title={r008ReadinessCopy.blockedTitle}
        />
        <R008ListCard
          items={r008ReadinessCopy.decisions}
          title={r008ReadinessCopy.decisionsTitle}
        />
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">ملخص آمن</h2>
        <dl className="mt-4 grid gap-3 text-sm text-muted md:grid-cols-3">
          <div>
            <dt>المسار الحالي</dt>
            <dd className="mt-1 font-semibold text-foreground">
              {ownerEvidence.currentApprovedPath}
            </dd>
          </div>
          <div>
            <dt>أدلة آمنة فقط</dt>
            <dd className="mt-1 font-semibold text-foreground">
              {ownerEvidence.safeEvidenceOnly ? "نعم" : "لا"}
            </dd>
          </div>
          <div>
            <dt>قبول إنتاج</dt>
            <dd className="mt-1 font-semibold text-foreground">
              {ownerEvidence.productionAcceptanceGranted ? "ممنوح" : "غير ممنوح"}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
