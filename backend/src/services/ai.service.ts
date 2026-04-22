import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';

interface TicketContext {
  subject: string;
  body: string;
  name: string;
  email: string;
  priority: string;
  status: string;
}

interface TimelineEntry {
  type: string;
  message: string;
  createdBy?: { email: string; role: string } | null;
}

const getModel = () => {
  if (!env.GEMINI_API_KEY) {
    throw ApiError.badRequest('AI features are not configured. Please set GEMINI_API_KEY.');
  }
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
};

/**
 * Generate a draft reply for a ticket based on conversation context.
 */
export const draftReply = async (
  ticket: TicketContext,
  timeline: TimelineEntry[]
): Promise<string> => {
  const model = getModel();

  const conversationHistory = timeline
    .filter((e) => e.type === 'reply' || e.type === 'created')
    .map((e) => {
      const sender = e.createdBy ? `${e.createdBy.email} (${e.createdBy.role})` : `Customer (${ticket.name})`;
      return `${sender}: ${e.message}`;
    })
    .join('\n\n');

  const prompt = `You are a professional, empathetic customer support agent for a helpdesk.

Based on the following ticket and conversation history, draft a helpful reply to the customer.

**Ticket Subject:** ${ticket.subject}
**Priority:** ${ticket.priority}
**Status:** ${ticket.status}
**Customer Name:** ${ticket.name}
**Customer Email:** ${ticket.email}

**Original Ticket:**
${ticket.body}

**Conversation History:**
${conversationHistory || 'No replies yet.'}

**Instructions:**
- Address the customer by their first name.
- Be professional, empathetic, and solution-oriented.
- Keep the reply concise (2–4 paragraphs max).
- Do NOT include subject lines, signatures, or email headers — just the reply body.
- If there isn't enough context to fully resolve the issue, ask a targeted follow-up question.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    logger.info({ ticketSubject: ticket.subject }, 'ai: draft reply generated');
    return text;
  } catch (err: any) {
    const msg = err?.message || err?.errorDetails || String(err);
    logger.error({ err: msg, status: err?.status, details: err?.errorDetails }, 'ai: draft reply failed');
    throw ApiError.internal(`AI draft failed: ${msg}`);
  }
};

/**
 * Summarise a ticket and suggest a priority.
 */
export const summariseTicket = async (
  ticket: TicketContext,
  timeline: TimelineEntry[]
): Promise<{ summary: string; suggestedPriority: string }> => {
  const model = getModel();

  const allMessages = timeline
    .map((e) => `[${e.type}] ${e.message}`)
    .join('\n');

  const prompt = `You are a support ticket analyst.

Summarise the following support ticket in 2–3 sentences. Then suggest a priority level (low, medium, or high) based on urgency and customer impact.

**Ticket Subject:** ${ticket.subject}
**Current Priority:** ${ticket.priority}
**Status:** ${ticket.status}
**Customer:** ${ticket.name} <${ticket.email}>

**Original Ticket:**
${ticket.body}

**Timeline:**
${allMessages || 'No activity yet.'}

Respond in EXACTLY this JSON format (no markdown, no code fences):
{"summary": "your summary here", "suggestedPriority": "low|medium|high"}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Try to parse JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn({ text }, 'ai: summarise response not valid JSON');
      return { summary: text, suggestedPriority: ticket.priority };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    logger.info({ ticketSubject: ticket.subject }, 'ai: summary generated');
    return {
      summary: parsed.summary || text,
      suggestedPriority: ['low', 'medium', 'high'].includes(parsed.suggestedPriority)
        ? parsed.suggestedPriority
        : ticket.priority,
    };
  } catch (err: any) {
    const msg = err?.message || err?.errorDetails || String(err);
    logger.error({ err: msg, status: err?.status, details: err?.errorDetails }, 'ai: summarise failed');
    throw ApiError.internal(`AI summary failed: ${msg}`);
  }
};
