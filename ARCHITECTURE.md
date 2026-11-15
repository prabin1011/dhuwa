# Dhuwa System Architecture & Engineering Specifications

Dhuwa is an end-to-end smoking cessation, urge-surfing, and habit-replacement application engineered with Next.js 14, React 18, Tailwind CSS, Google GenKit AI, and Firebase Cloud Datastores.

---

## 1. Architectural Overview & System Flow

```
[ User Interaction: Urge Trigger / Check-in ]
                    │
                    ▼
[ Client Layer: React 18 / Next.js PWA / Lucide ]
  ├─ Urge Surfing Timer (Marlatt Exponential Decay Model)
  ├─ Breathing & Grounding Kinetic Visualizers
  └─ Offline Service Worker State Cache
                    │
                    ▼
[ Application & Business Domain Layer ]
  ├─ Gamification Engine (XP Curves, Tier Milestones, Streaks)
  ├─ Daily Mission Deterministic Seeded Pool
  ├─ Anti-Spam Notification Throttling (SHA-1 Digest Guard)
  └─ Bayesian Relapse Risk & Circadian Forecaster
                    │
                    ▼
[ Intelligent AI & Integration Gateway ]
  ├─ Google GenKit AI Flows (Narrate Urge & Replacement Matching)
  ├─ Firebase Firestore Managed Datastores
  └─ Internationalization Routing (next-intl: EN / NB)
```

---

## 2. Core Modules & Responsibilities

| Module | Location | Responsibility |
|---|---|---|
| **Relapse Risk Engine** | `src/lib/relapse-risk-engine.ts` | Exponential craving decay formula ($I(t) = I_0 e^{-\lambda t}$) and Bayesian risk probability based on streak fatigue and circadian trigger histograms. |
| **Gamification Engine** | `src/lib/gamification.ts` | Calculates 28 user progression tiers (from *Spark* to *Dhuwa Legend*), non-cumulative streak milestone rewards, and level advancement percentages. |
| **Daily Missions** | `src/lib/daily-missions.ts` | Deterministic seeded PRNG generator selecting 3 daily health missions mapped to user cessation objectives. |
| **Notification Guard** | `src/lib/notify-guard.ts` | SHA-1 content hashing, deduplication, and cooldown enforcement preventing notification fatigue. |
| **GenKit AI Flows** | `src/ai/flows/` | Multi-turn AI flows generating real-time psychological urge narratives and habit replacement strategies. |
| **Firestore Subscriptions** | `src/firebase/firestore/` | Reactive collection and document snapshot hooks with non-blocking offline fallbacks. |

---

## 3. Behavioral Psychology Model

Dhuwa implements the **Urge Surfing** model established by G. Alan Marlatt, Ph.D. at the University of Washington Addictive Behaviors Research Center:
* **The Craving Wave Principle**: Cravings naturally peak within 3–5 minutes and decay exponentially with a half-life of 12–15 minutes if not fed.
* **Non-Judgmental Somatosensory Attention**: Interactive breathing exercises guide the user to observe physical craving sensations without cognitive fusion.
* **Immediate Replacement Reinforcement**: Diverts dopaminergic anticipation into non-combustive micro-actions, tracked and incentivized via the Gamification Engine.

---

## 4. Security, Privacy & Compliance Architecture

* **Service Credential Isolation**: Administrative credentials are provided strictly via environment variables (`FIREBASE_SERVICE_ACCOUNT_KEY`). No plaintext private keys are permitted in repository commits.
* **Client-Side Data Safeguards**: Sensitive user habit logs and relapse entries are indexed under user-isolated Firestore security paths (`users/{userId}/*`), protected by authentication identity checks.
* **Offline-First PWA Protection**: Service workers cache static application assets while ensuring health telemetry is synchronized only across secure HTTPS connections.
