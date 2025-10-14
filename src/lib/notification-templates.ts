
export const notificationTemplates = {
  // ——— Streaks ———
  streakThreeHours: [
    { title: "3 hours strong", body: "Well done." },
    { title: "3 hours strong", body: "Well done, {{name}}." },
    { title: "Three-hour mark", body: "Your system is already quieter than it was. Keep stacking quiet wins." },
    { title: "A real shift", body: "Three hours without feeding it. Notice the space you just created." },
  ],
  streakEightHours: [
    { title: "8 hours free", body: "You moved through a whole workday without it. Capacity > craving." },
    { title: "Workday win", body: "You kept momentum through the busy hours. That’s skill, not luck." },
    { title: "Solid distance", body: "Eight hours is substance. The little pull gets smaller when ignored." },
  ],
  streakOneDay: [
    { title: "24 hours down", body: "A full day. The little monster weakens when you don’t feed it." },
    { title: "One-day streak", body: "Yesterday didn’t own you. That’s what control feels like." },
    { title: "A new baseline", body: "One day is proof. Bank it in your memory—you can do this." },
  ],

  // ——— Events ———
  highVolumeLog: [
    { title: "A heavy moment", body: "That was a lot at once. Be curious, not harsh: what set it up?" },
    { title: "Pause & look", body: "You logged a spike. What were the 10 minutes leading into it?" },
    { title: "A useful mirror", body: "No judgement. Map the trigger → the urge → the choice. That’s the lesson." },
  ],
  firstReplacement: [
    { title: "You chose different", body: "That’s the exact muscle that frees you. Small, repeatable, yours." },
    { title: "A turning point", body: "Replacement beats resistance. You didn’t fight the urge—you redirected it." },
    { title: "That’s the move", body: "You picked a healthier default. Make it easy to repeat tomorrow." },
  ],
  perfectDay: [
    { title: "A perfect day on plan", body: "Every planned moment: respected. That’s real control." },
    { title: "Promise kept", body: "Yesterday you backed yourself all day. Savor that feeling." },
    { title: "Clean sheet", body: "You chose alignment again and again. That’s how identity shifts." },
  ],

  // ——— Patterns & Weekly ———
  morningPattern: [
    { title: "Morning spike", body: "Mornings bite today ({{count}} logs). Put one tiny default before 9am." },
    { title: "AM pattern spotted", body: "Early hours stacked up. Put water/breath/walk at arm’s reach." },
    { title: "Set the first domino", body: "Two+ before 9. One pre-decided action beats groggy willpower." },
  ],
  weekly: [
    { title: "Your week at a glance", body: "Logged {{total}}. Peak window: {{window}}. Pick one tiny lever for next week." },
    { title: "Weekly reflection", body: "This week tells a story. {{total}} total; strongest pull: {{window}}." },
    { title: "A quiet review", body: "{{total}} logged; most activity near {{window}}. Adjust one habit in that slot." },
  ],
};
