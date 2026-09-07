import OpenAI from 'openai';
import { llm, MODEL } from './client.js';
import { buildSystemPrompt } from './systemPrompt.js';
import { TOOLS } from './tools.js';
import { executeTool } from './toolExecutors.js';
import { makeTurn, type InternalCallSession } from '../store/callStore.js';

const MAX_TOOL_ITERATIONS = 6;
const FALLBACK_MESSAGE = "I'm sorry, I'm having trouble completing that right now — let me connect you with a live agent who can help.";

function autoEscalate(session: InternalCallSession, reason: string, summary: string): void {
  session.status = 'escalated';
  session.endedAt = new Date().toISOString();
  session.escalation = {
    reason,
    summary,
    attemptedSteps: session.transactionsCompleted,
    verifiedIdentity: session.identityVerified,
    verificationLevel: session.verificationLevel,
    callerName: session.callerName,
    accountId: session.accountId,
    intent: session.intent,
    escalatedAt: new Date().toISOString(),
  };
}

/** Runs one caller turn (or the initial greeting, when callerText is null) through the agentic loop. */
export async function runTurn(session: InternalCallSession, callerText: string | null): Promise<string> {
  if (callerText) {
    session.transcript.push(makeTurn('caller', callerText));
    session.llmHistory.push({ role: 'user', content: callerText });
  } else {
    // Kick off the greeting with an initial instruction the caller never sees.
    session.llmHistory.push({ role: 'user', content: '[Call connected. Greet the caller.]' });
  }

  let finalText = '';

  try {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await llm.chat.completions.create({
        model: MODEL,
        max_tokens: 2048,
        messages: [{ role: 'system', content: buildSystemPrompt() }, ...session.llmHistory],
        tools: TOOLS,
      });

      const message = response.choices[0].message;
      session.llmHistory.push(message);

      const toolCalls = message.tool_calls ?? [];
      if (toolCalls.length === 0) {
        finalText = (message.content ?? '').trim();
        break;
      }

      for (const call of toolCalls) {
        const input = JSON.parse(call.function.arguments) as Record<string, unknown>;
        const result = await executeTool(call.function.name, input, session);
        session.transcript.push(
          makeTurn('system-event', `[${call.function.name}]`, {
            tool: call.function.name,
            input,
            result,
          }),
        );
        session.llmHistory.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }
  } catch (error) {
    finalText = FALLBACK_MESSAGE;
    autoEscalate(session, 'tool_error', 'The AI agent hit an unrecoverable error mid-call and was auto-escalated.');
    if (error instanceof OpenAI.APIError) {
      console.error(`Groq API error (${error.status}):`, error.message);
    } else {
      console.error('Orchestrator error:', error);
    }
  }

  if (!finalText) {
    finalText = FALLBACK_MESSAGE;
    if (session.status !== 'escalated') {
      autoEscalate(
        session,
        'orchestrator_iteration_limit',
        'The agent could not resolve the request within the tool-call budget for this turn.',
      );
    }
  }

  session.transcript.push(makeTurn('assistant', finalText));
  if (session.status === 'connecting') session.status = 'in-progress';
  return finalText;
}
