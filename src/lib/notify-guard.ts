import crypto from 'crypto';

export function contentHash(s: string) {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
}

export function canSendNotification(opts: {
  lastSentAt?: number; // epoch ms
  minCooldownMin?: number; // e.g. 60
  lastContentHash?: string;
  nextContent: string;
}) {
  const now = Date.now();
  const { lastSentAt, minCooldownMin = 60, lastContentHash, nextContent } =
    opts;

  if (lastSentAt && now - lastSentAt < minCooldownMin * 60_000) {
    return { ok: false, reason: 'cooldown' as const };
  }
  const h = contentHash(nextContent);
  if (lastContentHash && lastContentHash === h) {
    return { ok: false, reason: 'duplicate' as const };
  }
  return { ok: true, hash: h as string };
}
