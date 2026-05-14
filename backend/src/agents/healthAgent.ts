/**
 * Personal Health Agent — Claude-powered AI health advocate.
 * Maintains longitudinal context via MemWal (Walrus blob per patient).
 * 
 * Tools available to the agent:
 *   - synthesize_timeline: build a clean health timeline from raw records
 *   - check_interactions: flag medication interactions
 *   - match_trials: find clinical trials the patient qualifies for
 *   - generate_visit_briefing: pre-visit summary for the doctor
 */
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Meridian, a personal AI health advocate. You work exclusively for the patient — never for hospitals, insurers, or pharmaceutical companies.

Your responsibilities:
1. Synthesize scattered medical records into a clear, chronological health timeline
2. Identify medication interactions the patient may not know about
3. Flag trending patterns in lab results (e.g., rising A1C, declining kidney function)
4. Match the patient to clinical trials they qualify for
5. Generate plain-language visit briefings for new doctors
6. Monitor for billing errors against documented care

Always communicate in plain language. Flag anything urgent immediately. Be the advocate the patient never had.`;

export interface HealthRecord {
  type: string;
  date: string;
  content: string;
  source?: string;
}

export interface AgentResponse {
  timeline?: TimelineEvent[];
  interactions?: MedicationInteraction[];
  trialMatches?: ClinicalTrial[];
  summary: string;
  urgentFlags: string[];
}

export interface TimelineEvent {
  date: string;
  type: string;
  title: string;
  summary: string;
  significance: 'routine' | 'notable' | 'critical';
}

export interface MedicationInteraction {
  drug1: string;
  drug2: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

export interface ClinicalTrial {
  studyId: string;
  title: string;
  sponsor: string;
  compensation: string;
  matchReason: string;
}

/** Synthesize a health timeline from raw records using Claude. */
export async function synthesizeHealthTimeline(
  records: HealthRecord[],
  patientContext?: string
): Promise<AgentResponse> {
  const recordsText = records
    .map(r => `[${r.date}] ${r.type.toUpperCase()} (${r.source ?? 'unknown'}): ${r.content}`)
    .join('\n\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze these medical records and return a JSON response with this exact structure:
{
  "timeline": [{ "date": "YYYY-MM-DD", "type": "lab|imaging|prescription|visit", "title": "...", "summary": "...", "significance": "routine|notable|critical" }],
  "interactions": [{ "drug1": "...", "drug2": "...", "severity": "mild|moderate|severe", "description": "..." }],
  "trialMatches": [{ "studyId": "NCT...", "title": "...", "sponsor": "...", "compensation": "$X", "matchReason": "..." }],
  "summary": "2-3 sentence plain language health summary",
  "urgentFlags": ["..."]
}

Patient context: ${patientContext ?? 'None provided'}

Medical records:
${recordsText}

Return ONLY valid JSON, no markdown.`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
  try {
    return JSON.parse(text) as AgentResponse;
  } catch {
    return { summary: text, urgentFlags: [] };
  }
}

/** Generate a pre-visit briefing for a new doctor. */
export async function generateVisitBriefing(
  patientSummary: string,
  visitReason: string
): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate a concise clinical briefing (max 300 words) for a new doctor.
Visit reason: ${visitReason}
Patient health summary: ${patientSummary}

Format: plain text, clinical but readable. Lead with the most important context.`,
      },
    ],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}

/** Stream a conversational response from the health agent. */
export async function* streamAgentChat(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  patientContext: string
): AsyncGenerator<string> {
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `${SYSTEM_PROMPT}\n\nPatient health context:\n${patientContext}`,
    messages: [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      yield chunk.delta.text;
    }
  }
}
