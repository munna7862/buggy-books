const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Denylist behind refresh-token rotation. A consumed token's `jti` is remembered
 * until it would have expired anyway, and a family is revoked when a stolen or
 * replayed token is detected, or on logout.
 *
 * Held in memory on purpose: a restart forgets it, so consumed tokens become
 * usable again until they expire. Persist it before relying on it in production.
 */
class RefreshTokenStore {
  private consumed = new Map<string, { consumedAt: number; expiresAt: number }>();
  private revokedFamilies = new Map<string, number>();

  public getConsumedAt(jti: string): number | undefined {
    return this.consumed.get(jti)?.consumedAt;
  }

  public consume(jti: string, expiresAt: number): void {
    this.prune();
    this.consumed.set(jti, { consumedAt: Date.now(), expiresAt });
  }

  public isFamilyRevoked(family: string): boolean {
    return this.revokedFamilies.has(family);
  }

  /** Every token issued in the family before now expires within the refresh lifetime. */
  public revokeFamily(family: string): void {
    this.prune();
    this.revokedFamilies.set(family, Date.now() + THIRTY_DAYS_MS);
  }

  public reset(): void {
    this.consumed.clear();
    this.revokedFamilies.clear();
  }

  private prune(): void {
    const now = Date.now();
    for (const [jti, entry] of this.consumed) {
      if (entry.expiresAt <= now) this.consumed.delete(jti);
    }
    for (const [family, expiresAt] of this.revokedFamilies) {
      if (expiresAt <= now) this.revokedFamilies.delete(family);
    }
  }
}

export const refreshTokenStore = new RefreshTokenStore();
