import { evaluate, rankScholarships } from './match';
import { daysUntil, deadlineLabel, formatDate } from './dates';
import type { AppState, DocumentId, Scholarship } from '../types';
export interface AssistantReply { text: string; related?: number[]; followUps: string[] }
const FOLLOW_UPS = ['What am I eligible for?', 'What is the next deadline?', 'Which documents am I missing?', 'Help me write my statement of purpose'];
const list = (items: string[]): string => items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
function buildSop(state: AppState, target = 'this scholarship opportunity'): string {
  const p = state.profile;
  return `Statement of purpose — working draft\nTarget: ${target}\n\nDear Selection Committee,\n\nI am applying for ${target} to support my ${p.level} studies${p.state ? ` in ${p.state}` : ''}. My interests include ${p.interests || '[describe your academic interests]'}. [Add a specific project or experience that shows your commitment.]\n\nThis scholarship would help me [explain the specific educational costs you need to cover]. My goal is to [describe a realistic academic or community outcome]. [Add evidence for these claims and tailor this paragraph to the provider’s mission.]\n\nThank you for considering my application.\n${p.name || '[Your name]'}\n\nBefore submitting: replace every bracketed prompt, verify all claims, and follow the provider’s word limit. This is a template, not a verified personal essay.`;
}
/** Deterministic, on-device intent engine. No network calls or invented eligibility decisions. */
export function answer(rawQuestion: string, state: AppState, catalog: readonly Scholarship[], now = new Date()): AssistantReply {
  const q = rawQuestion.toLowerCase();
  const ranked = rankScholarships(catalog, state.profile, state.readyDocs, now);
  const eligible = ranked.filter((r) => r.evaluation.eligible).map((r) => r.scholarship);
  const named = catalog.filter((s) => q.includes(s.name.toLowerCase()) || q.includes(s.slug.replaceAll('-', ' '))).sort((a,b) => b.name.length - a.name.length)[0];
  const matched = named ?? catalog.find((s) => q.includes(s.org.toLowerCase()));
  if (/hello|hi\b|hey|greetings/.test(q)) return { text: `Hi${state.profile.name ? ` ${state.profile.name.split(' ')[0]}` : ''}! I’m Grant, a deterministic on-device guide. I can screen your profile, explain published deadlines, find preparation gaps and help outline an essay. I do not submit applications or decide eligibility.`, followUps: FOLLOW_UPS };
  if (/essay|statement|purpose|sop|write|draft|letter|cover/.test(q)) return { text: buildSop(state, matched?.name), related: matched ? [matched.id] : undefined, followUps: FOLLOW_UPS };
  if (matched !== undefined) {
    const ev = evaluate(matched, state.profile, state.readyDocs);
    return { text: `${matched.name}\nAward: ${matched.awardLabel}${matched.fundingType === 'loan' ? ' (repayable loan)' : ''}\nDeadline: ${formatDate(matched.deadline).full} — ${deadlineLabel(daysUntil(matched.deadline, now))}\nScreening: ${ev.eligible ? 'Your basic profile criteria match; additional conditions still need verification.' : list([...ev.gaps, ...ev.unknowns]) || 'Review the official conditions.'}\nAdditional conditions: ${matched.conditions.join(' ')}\nSource checked: ${formatDate(matched.verifiedAt).full}. Confirm current details at ${matched.sourceUrl}`, related: [matched.id], followUps: [`Draft an SOP for ${matched.name}`, ...FOLLOW_UPS.slice(1)] };
  }
  if (/deadline|due|closing|soon|when|urgent/.test(q)) {
    const upcoming = eligible.filter((s) => daysUntil(s.deadline, now) >= 0).sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? '')).slice(0, 4);
    if (upcoming.length === 0) return { text: state.profile.complete ? 'No verified open deadline currently matches all your basic profile criteria. Unknown dates are not counted. Explore the catalogue and check official updates.' : 'Set up your profile first so I can screen deadlines. I only count published, unexpired dates; unknown dates need an official-source check.', followUps: FOLLOW_UPS };
    return { text: `Earliest published deadlines matching your basic profile:\n${upcoming.map((s) => `• ${s.name}: ${formatDate(s.deadline).full} (${deadlineLabel(daysUntil(s.deadline, now))})`).join('\n')}\nConfirm cutoff times and extensions on the official portal.`, related: upcoming.map((s) => s.id), followUps: FOLLOW_UPS };
  }
  if (/document|missing|paper|certificate|vault|upload|aadhaar|income cert/.test(q)) {
    const missing = new Map<DocumentId, number>();
    for (const s of eligible) for (const doc of s.docs) if (!state.readyDocs.includes(doc)) missing.set(doc, (missing.get(doc) ?? 0) + 1);
    if (!state.profile.complete) return { text: 'Set up your profile to identify relevant preparation gaps. The Vault can hold local PDF, JPEG and PNG copies; it never uploads to a provider.', followUps: FOLLOW_UPS };
    return { text: missing.size === 0 ? 'All documents in the planning checklists for your basic matches are marked ready. Check the official guidelines for the definitive upload list.' : `Prepare these next:\n${[...missing.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([doc, count]) => `• ${doc} — referenced by ${count} matching scheme${count === 1 ? '' : 's'}`).join('\n')}\nMarking ready is not verification. Keep originals and submit only through official portals.`, followUps: FOLLOW_UPS };
  }
  if (/tip|improve|chance|advice|help|guide/.test(q)) return { text: '1. Verify the current official guidelines and deadline.\n2. Check names and dates across your documents.\n3. Apply early and save the acknowledgement.\n4. Track institute verification after submission.\n5. Never pay an agent who guarantees an award or share passwords/OTPs.', followUps: FOLLOW_UPS };
  if (!state.profile.complete) return { text: 'Start with your study level, category, state and income. I can then explain which basic criteria match and what still needs checking. The catalogue has official-source links for every opportunity.', related: ranked.slice(0, 3).map((r) => r.scholarship.id), followUps: FOLLOW_UPS };
  const top = ranked.filter((r) => r.evaluation.eligible).slice(0, 3);
  return { text: top.length === 0 ? 'No scheme matches all the basic criteria you supplied. Review the closest matches and their stated gaps; do not change accurate information just to obtain a match.' : `Your top basic profile matches:\n${top.map((r) => `• ${r.scholarship.name}: ${r.scholarship.awardLabel}. ${list(r.evaluation.reasons)}.`).join('\n')}\nInstitution, admission year and other conditions still apply. These are not award decisions.`, related: (top.length ? top : ranked.slice(0, 3)).map((r) => r.scholarship.id), followUps: FOLLOW_UPS };
}
