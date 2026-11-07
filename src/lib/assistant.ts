import { SCHOLARSHIPS } from '../data/scholarships';
import { evaluate, rankScholarships } from './match';
import { daysUntil, formatDate, formatInr } from './dates';
import type { AppState, Scholarship } from '../types';

export interface AssistantReply {
  text: string;
  related?: number[];
  followUps: string[];
}

const DEFAULT_FOLLOW_UPS = [
  'What am I eligible for?',
  'What is the next deadline?',
  'Which documents am I missing?',
  'Help me write my statement of purpose',
];

function sentenceList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1] ?? ''}`;
}

function eligibleList(state: AppState): Scholarship[] {
  return SCHOLARSHIPS.filter((s) => evaluate(s, state.profile, state.readyDocs).eligible);
}

function missingDocsFor(state: AppState): Map<string, number> {
  const missing = new Map<string, number>();
  for (const s of eligibleList(state)) {
    for (const doc of s.docs) {
      if (!state.readyDocs.includes(doc)) missing.set(doc, (missing.get(doc) ?? 0) + 1);
    }
  }
  return missing;
}

function buildSop(state: AppState, targetSchemeName?: string): string {
  const p = state.profile;
  const target = targetSchemeName ?? 'this scholarship opportunity';
  return [
    `Statement of Purpose Draft for ${p.name}:`,
    `Target: ${target}`,
    ``,
    `Dear Selection Committee,`,
    ``,
    `I am writing to express my earnest application for ${target}. Currently pursuing my ${p.level} education from ${p.state}, my academic pursuit has been driven by a dedicated passion for ${p.interests || 'academic excellence and societal impact'}. Achieving ${p.marks}% in my previous examinations demonstrates my diligence and commitment to academic rigour.`,
    ``,
    `Coming from a family with an annual income of ${formatInr(p.income)}, educational financing represents the most significant hurdle on my path. This grant would alleviate the immediate burden of tuition and essential learning resources, empowering me to channel my full energy toward mastering my curriculum and building practical projects.`,
    ``,
    `Upon completing my degree, I intend to leverage my knowledge to give back by mentoring other students from similar backgrounds and contributing meaningfully to community innovation. Thank you for considering my application.`,
    ``,
    `Sincerely,`,
    `${p.name}`,
    ``,
    `[Tip: You can click "Copy draft" below, paste this into your word processor, and customize any institution-specific details.]`,
  ].join('\n');
}

/** Deterministic, on-device intent engine — no network calls, no data leaves the browser. */
export function answer(rawQuestion: string, state: AppState): AssistantReply {
  const q = rawQuestion.toLowerCase();
  const eligible = eligibleList(state);

  // Greeting
  if (/hello|hi\b|hey|greetings/.test(q)) {
    return {
      text: `Hi ${state.profile.name.split(' ')[0] ?? 'there'}! I am Grant, your on-device funding assistant. I can analyze your matches, calculate deadlines, pinpoint missing documents, and draft tailored statements of purpose — all processed locally inside your browser with complete privacy.`,
      followUps: DEFAULT_FOLLOW_UPS,
    };
  }

  // Specific scholarship lookups
  const matchedScheme = SCHOLARSHIPS.find((s) => q.includes(s.name.toLowerCase()) || q.includes(s.org.toLowerCase()));
  if (matchedScheme) {
    const ev = evaluate(matchedScheme, state.profile, state.readyDocs);
    const days = daysUntil(matchedScheme.deadline);
    const status = ev.eligible
      ? `You are eligible (${ev.score}% match)! Key criteria met: ${sentenceList(ev.reasons)}.`
      : `You may face eligibility hurdles: ${sentenceList(ev.gaps)}.`;
    return {
      text: `About ${matchedScheme.name} (${matchedScheme.org}):\n• Award: ${matchedScheme.amount}\n• Deadline: ${formatDate(matchedScheme.deadline).full} (${days} days left)\n• Status: ${status}\n• Required documents: ${matchedScheme.docs.join(', ')} (${ev.docsReady}/${ev.docsRequired} ready in your vault).`,
      related: [matchedScheme.id],
      followUps: [`Draft an SOP for ${matchedScheme.name}`, 'Which documents am I missing?', 'What is the next deadline?'],
    };
  }

  // Deadlines
  if (/deadline|due|closing|soon|when|urgent/.test(q)) {
    const upcoming = [...eligible]
      .filter((s) => daysUntil(s.deadline) >= 0)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 4);
    if (upcoming.length === 0) {
      return {
        text: 'You have no eligible scholarships with open deadlines right now. Try widening your profile parameters or checking back later.',
        followUps: DEFAULT_FOLLOW_UPS,
      };
    }
    const lines = upcoming
      .map((s) => `• ${s.name}: Closes ${formatDate(s.deadline).full} (${daysUntil(s.deadline)} days remaining)`)
      .join('\n');
    return {
      text: `Here are your earliest eligible deadlines:\n${lines}\nPrioritise applications closing within 14 days so you have ample time to verify and upload documents.`,
      related: upcoming.map((s) => s.id),
      followUps: ['Which documents am I missing?', 'Help me write my statement of purpose', 'What am I eligible for?'],
    };
  }

  // Document Vault & Missing Documents
  if (/document|missing|paper|certificate|vault|upload|aadhaar|income cert/.test(q)) {
    const missing = missingDocsFor(state);
    if (missing.size === 0) {
      return {
        text: `Great news! Every document required by your eligible scholarships is already marked ready in your Document Vault (${state.readyDocs.length} documents verified).`,
        followUps: ['What is the next deadline?', 'Help me write my statement of purpose'],
      };
    }
    const entries = [...missing.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const lines = entries.map(([doc, count]) => `• ${doc} — required by ${count} of your eligible schemes.`).join('\n');
    return {
      text: `To unlock your highest-priority applications, gather these documents next:\n${lines}\nTip: Income certificates are typically issued by your local Sub-Divisional Magistrate (SDM) or Tehsildar and should be dated within the current financial year. Check off each document in the Vault once obtained.`,
      followUps: ['What is the next deadline?', 'What am I eligible for?'],
    };
  }

  // SOP & Essay drafting
  if (/essay|statement|purpose|sop|write|draft|letter|cover/.test(q)) {
    return {
      text: buildSop(state),
      followUps: ['Which documents am I missing?', 'What is the next deadline?', 'What am I eligible for?'],
    };
  }

  // Income / Financial Assistance / Loans
  if (/loan|money|amount|fund|worth|value|grant|income/.test(q)) {
    const total = eligible.length;
    return {
      text: `You currently match ${total} schemes based on your family income of ${formatInr(state.profile.income)}. Award values range from ₹12,000 to over ₹2,00,000 in non-repayable grants. If higher financing is needed, state programmes like the Bihar Student Credit Card provide low-interest education loans up to ₹4L.`,
      followUps: ['Sort by award size', 'What am I eligible for?'],
    };
  }

  // Tips / Improve Chances
  if (/tip|improve|chance|advice|help|guide/.test(q)) {
    return {
      text: `Top 3 recommendations to maximize your scholarship success:\n1. Apply early: Portals often slow down near deadlines due to server load.\n2. Verify certificates: Ensure names and dates on your Aadhaar, marksheets, and income certificates match character-for-character.\n3. Track progress: Use the Kanban board in Grantly to track each application from Saved → In progress → Submitted.`,
      followUps: ['What is the next deadline?', 'Which documents am I missing?'],
    };
  }

  // Default / Ranking Matches
  const ranked = rankScholarships(SCHOLARSHIPS, state.profile, state.readyDocs);
  const top = ranked.filter((r) => r.evaluation.eligible).slice(0, 3);
  if (top.length === 0) {
    return {
      text: `Based on your profile (${state.profile.level}, ${state.profile.category}, ${formatInr(state.profile.income)} income), no schemes match all mandatory criteria yet. The closest option is ${ranked[0]?.scholarship.name ?? '—'}: ${ranked[0]?.evaluation.gaps.join('; ') ?? ''}. You can update your profile in settings to explore other categories.`,
      followUps: ['Edit my profile', 'Which documents am I missing?'],
    };
  }
  const lines = top
    .map((r) => {
      const ev = r.evaluation;
      return `• ${r.scholarship.name} (${r.scholarship.amount}) — ${ev.score}% match (${sentenceList(ev.reasons)}). ${ev.docsRequired - ev.docsReady} document(s) still needed.`;
    })
    .join('\n');
  return {
    text: `Here are your top matched scholarships:\n${lines}`,
    related: top.map((r) => r.scholarship.id),
    followUps: ['What is the next deadline?', 'Which documents am I missing?', 'Help me write my statement of purpose'],
  };
}
