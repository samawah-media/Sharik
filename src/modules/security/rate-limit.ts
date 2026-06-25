export type RateLimitDecision =
  | { ok: true }
  | { ok: false; error: "RATE_LIMITED"; retryAfterSeconds: number };

export type RateLimiter = {
  check(input: {
    key: string;
    limit: number;
    windowMs: number;
    now: Date;
  }): Promise<RateLimitDecision>;
};

export class InMemoryRateLimiter implements RateLimiter {
  private readonly attempts = new Map<string, number[]>();

  async check({
    key,
    limit,
    windowMs,
    now,
  }: {
    key: string;
    limit: number;
    windowMs: number;
    now: Date;
  }) {
    const cutoff = now.getTime() - windowMs;
    const recent = (this.attempts.get(key) ?? []).filter(
      (timestamp) => timestamp > cutoff,
    );

    if (recent.length >= limit) {
      const oldest = recent[0] ?? now.getTime();
      return {
        ok: false as const,
        error: "RATE_LIMITED" as const,
        retryAfterSeconds: Math.ceil((oldest + windowMs - now.getTime()) / 1000),
      };
    }

    recent.push(now.getTime());
    this.attempts.set(key, recent);
    return { ok: true as const };
  }
}

export const allowAllRateLimiter: RateLimiter = {
  async check() {
    return { ok: true };
  },
};
