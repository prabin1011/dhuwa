import { describe, it, expect } from 'vitest';
import { contentHash, canSendNotification } from '@/lib/notify-guard';

describe('Notification Guard & Anti-Spam Throttling', () => {
  it('generates consistent content hash for equivalent strings', () => {
    const hash1 = contentHash('Take a deep breath and ride the wave.');
    const hash2 = contentHash('Take a deep breath and ride the wave.');
    const hash3 = contentHash('Different message');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(12);
  });

  it('permits sending when no prior notification timestamp exists', () => {
    const check = canSendNotification({
      nextContent: 'Morning motivation check-in!',
    });
    expect(check.ok).toBe(true);
    if (check.ok) {
      expect(check.hash).toBeTruthy();
    }
  });

  it('rejects notification when within minimum cooldown window', () => {
    const recentTime = Date.now() - 15 * 60 * 1000; // 15 mins ago
    const check = canSendNotification({
      lastSentAt: recentTime,
      minCooldownMin: 60, // 60 mins required
      nextContent: 'Check in with yourself.',
    });

    expect(check.ok).toBe(false);
    if (!check.ok) {
      expect(check.reason).toBe('cooldown');
    }
  });

  it('permits notification after minimum cooldown period expires', () => {
    const oldTime = Date.now() - 75 * 60 * 1000; // 75 mins ago
    const check = canSendNotification({
      lastSentAt: oldTime,
      minCooldownMin: 60,
      nextContent: 'Fresh reminder message',
    });

    expect(check.ok).toBe(true);
  });

  it('rejects duplicate content even if cooldown has passed', () => {
    const oldTime = Date.now() - 120 * 60 * 1000; // 2 hours ago
    const text = 'Stay strong today!';
    const h = contentHash(text);

    const check = canSendNotification({
      lastSentAt: oldTime,
      minCooldownMin: 60,
      lastContentHash: h,
      nextContent: text,
    });

    expect(check.ok).toBe(false);
    if (!check.ok) {
      expect(check.reason).toBe('duplicate');
    }
  });
});
