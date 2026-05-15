/**
 * Personal Health Agent — supports Anthropic Claude, Google Gemini, or OpenAI.
 * Auto-selects provider based on which API key is set in .env:
 *   ANTHROPIC_API_KEY  → Claude claude-sonnet-4-20250514
 *   GEMINI_API_KEY     → gemini-1.5-flash (free tier)
 *   OPENAI_API_KEY     → gpt-4o-mini
 */

const SYSTEM_PROMPT = `You are Meridian, a personal AI health advocate. You work exclusively for the patient — never for hospitals, insurers, or pharmaceutical companies.

Your responsibilities:
1. Synthesize scattered medical records into a clear, chronological health timeline
2. Identify medication interactions the patient may not know about
3. Flag trending patterns in lab results (e.g., rising A1C, declining kidney function)
4. Match the patient to clinical trials they qualify for
5. Generate plain-language visit briefings for new doctors

Always communicate in plain language. Flag anything urgent immediately.`;

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

// ── Provider detection ────────────────────────────────────────────────────────

function getProvider(): 'anthropic' | 'gemini' | 'openai' {
  if (process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant')) return 'anthropic';
  if (process.env.GEMINI_API_KEY?.startsWith('AIza')) return 'gemini';
  if (process.env.OPENAI_API_KEY?.startsWith('sk-')) return 'openai';
  throw new Error('No valid AI API key found. Set GEMINI_API_KEY (free at https://aistudio.google.com/apikey) in backend/.env');
}

// ── Single completion (for synthesis) ────────────────────────────────────────

async function complete(prompt: string): Promise<string> {
  const provider = getProvider();

  if (provider === 'anthropic') {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });
    return msg.content[0].type === 'text' ? msg.content[0].text : '';
  }

  if (provider === 'gemini') {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  if (provider === 'openai') {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });
    return res.choices[0].message.content ?? '';
  }

  return '';
}

// ── Streaming completion (for chat) ──────────────────────────────────────────

export async function* streamChat(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  patientContext: string
): AsyncGenerator<string> {
  const provider = getProvider();
  const systemWithContext = `${SYSTEM_PROMPT}\n\nPatient health context:\n${patientContext}`;

  if (provider === 'anthropic') {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemWithContext,
      messages: [...history, { role: 'user', content: userMessage }],
    });
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
    return;
  }

  if (provider === 'gemini') {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemWithContext,
    });
    const chatHistory = history
      .filter(m => m.content)
      .reduce((acc, m, i, arr) => {
        // Gemini requires history to start with user and alternate user/model
        if (i === 0 && m.role === 'assistant') return acc;
        acc.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
        return acc;
      }, [] as any[]);
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessageStream(userMessage);
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
    return;
  }

  if (provider === 'openai') {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      stream: true,
      messages: [
        { role: 'system', content: systemWithContext },
        ...history,
        { role: 'user', content: userMessage },
      ],
    });
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function synthesizeHealthTimeline(
  records: HealthRecord[],
  patientContext?: string
): Promise<AgentResponse> {
  const recordsText = records
    .map(r => `[${r.date}] ${r.type.toUpperCase()} (${r.source ?? 'unknown'}): ${r.content}`)
    .join('\n\n');

  const prompt = `Analyze these medical records and return a JSON response with this exact structure:
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

Return ONLY valid JSON, no markdown.`;

  const text = await complete(prompt);
  // Strip markdown code fences if model wraps response
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  try {
    return JSON.parse(cleaned) as AgentResponse;
  } catch {
    return { summary: text, urgentFlags: [] };
  }
}

export async function generateVisitBriefing(
  patientSummary: string,
  visitReason: string
): Promise<string> {
  return complete(`Generate a concise clinical briefing (max 300 words) for a new doctor.
Visit reason: ${visitReason}
Patient health summary: ${patientSummary}
Format: plain text, clinical but readable. Lead with the most important context.`);
}

export async function* streamAgentChat(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  patientContext: string
): AsyncGenerator<string> {
  yield* streamChat(userMessage, conversationHistory, patientContext);
}
