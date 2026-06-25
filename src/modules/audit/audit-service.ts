export type AuditDecision = "allowed" | "denied";

export type AuditEvent = {
  tenantId: string;
  clientId?: string;
  actorUserId?: string;
  action: string;
  decision: AuditDecision;
  targetType: string;
  targetId: string;
  reason?: string;
  occurredAt?: string;
};

export type AuditSink = {
  append: (event: AuditEvent) => Promise<void>;
};

export type TransactionalResource = {
  snapshot: () => unknown;
  restore: (snapshot: unknown) => void;
};

export type AuditAtomicUnitOfWork = {
  run<T>(operation: () => Promise<T>): Promise<T>;
};

const isTransactionalResource = (
  resource: unknown,
): resource is TransactionalResource =>
  Boolean(resource) &&
  typeof (resource as TransactionalResource).snapshot === "function" &&
  typeof (resource as TransactionalResource).restore === "function";

export class InMemoryAuditSink implements AuditSink {
  readonly events: AuditEvent[] = [];

  async append(event: AuditEvent) {
    this.events.push({
      ...event,
      occurredAt: event.occurredAt ?? new Date().toISOString(),
    });
  }

  snapshot() {
    return this.events.map((event) => ({ ...event }));
  }

  restore(snapshot: unknown) {
    this.events.length = 0;
    this.events.push(...(snapshot as AuditEvent[]).map((event) => ({ ...event })));
  }
}

export class FailingAuditSink implements AuditSink {
  async append() {
    throw new Error("AUDIT_APPEND_FAILED");
  }

  snapshot() {
    return undefined;
  }

  restore() {
    // No state to restore; this sink is used to prove append failure rollback.
  }
}

export class NonTransactionalAuditSink implements AuditSink {
  async append() {
    throw new Error("NON_TRANSACTIONAL_AUDIT_USED");
  }
}

export const runAuditAtomicMutation = async <T>({
  transaction,
  operation,
}: {
  transaction: AuditAtomicUnitOfWork;
  operation: () => Promise<T>;
}) => transaction.run(operation);

export const createRequiredAuditAtomicUnitOfWork = (
  resources: unknown[],
): AuditAtomicUnitOfWork => {
  const nonTransactionalIndex = resources.findIndex(
    (resource) => !isTransactionalResource(resource),
  );

  if (nonTransactionalIndex !== -1) {
    throw new Error("AUDIT_TRANSACTION_REQUIRED");
  }

  const transactionalResources = resources as TransactionalResource[];

  return {
    async run<T>(operation: () => Promise<T>) {
      const snapshots = transactionalResources.map((resource) =>
        resource.snapshot(),
      );

      try {
        return await operation();
      } catch (error) {
        for (let index = transactionalResources.length - 1; index >= 0; index -= 1) {
          transactionalResources[index].restore(snapshots[index]);
        }

        throw error;
      }
    },
  };
};

export const createAuditGuard = (sink: AuditSink) => ({
  async runSensitive<T>({
    auditEvent,
    operation,
  }: {
    auditEvent?: AuditEvent;
    operation: () => Promise<T>;
  }) {
    if (!auditEvent) {
      throw new Error("AUDIT_EVENT_REQUIRED");
    }

    const result = await operation();
    await sink.append(auditEvent);
    return result;
  },
});
