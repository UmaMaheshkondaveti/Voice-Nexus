import type { InternalCallSession } from '../store/callStore.js';
import { findAccountByPhone, findAccountById, toPublicAccount } from '../data/accounts.js';
import { PLAN_CATALOG, findPlanByName } from '../data/plans.js';
import { getAvailableWindows, findWindowById } from '../data/scheduling.js';

const REQUIRES_FULL_VERIFICATION = new Set([
  'make_payment',
  'change_plan',
  'update_service_address',
  'cancel_appointment',
]);

type ToolResult = Record<string, unknown>;

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  session: InternalCallSession,
): Promise<ToolResult> {
  switch (name) {
    case 'verify_identity':
      return verifyIdentity(input, session);
    case 'get_account':
      return getAccount(session);
    case 'start_subflow':
      return startSubflow(input, session);
    case 'complete_transaction':
      return completeTransaction(input, session);
    case 'escalate':
      return escalate(input, session);
    case 'close_call':
      return closeCall(session);
    default:
      return { error: 'unknown_tool', tool: name };
  }
}

function verifyIdentity(input: Record<string, unknown>, session: InternalCallSession): ToolResult {
  const phoneNumber = String(input.phoneNumber ?? '');
  const kbaAnswer = typeof input.kbaAnswer === 'string' ? input.kbaAnswer : undefined;

  const account = findAccountByPhone(phoneNumber);
  if (!account) {
    return { verified: false, level: 'none', reason: 'no_account_match' };
  }

  if (!kbaAnswer) {
    session.identityVerified = true;
    session.verificationLevel = 'ani';
    session.accountId = account.accountId;
    session.callerName = account.fullName;
    return {
      verified: true,
      level: 'ani',
      accountId: account.accountId,
      fullName: account.fullName,
      kbaQuestion: account.kbaQuestion,
    };
  }

  const match = kbaAnswer.trim().toLowerCase() === account.kbaAnswer.trim().toLowerCase();
  if (!match) {
    session.kbaFailures += 1;
    return { verified: false, level: 'ani', reason: 'kba_mismatch', failureCount: session.kbaFailures };
  }

  session.identityVerified = true;
  session.verificationLevel = 'ani+kba';
  session.accountId = account.accountId;
  session.callerName = account.fullName;
  return { verified: true, level: 'ani+kba', accountId: account.accountId, fullName: account.fullName };
}

function getAccount(session: InternalCallSession): ToolResult {
  if (!session.identityVerified || !session.accountId) {
    return { error: 'identity_not_verified' };
  }
  const account = findAccountById(session.accountId);
  if (!account) return { error: 'account_not_found' };
  return { ...toPublicAccount(account) };
}

function startSubflow(input: Record<string, unknown>, session: InternalCallSession): ToolResult {
  if (!session.identityVerified || !session.accountId) {
    return { error: 'identity_not_verified' };
  }
  const intent = String(input.intent ?? 'unknown') as InternalCallSession['intent'];
  session.intent = intent;

  const account = findAccountById(session.accountId);
  if (!account) return { error: 'account_not_found' };

  switch (intent) {
    case 'billing':
      return { balanceDue: account.balanceDue, lastPaymentDate: account.lastPaymentDate, lastPaymentAmount: account.lastPaymentAmount };
    case 'plan_change':
      return { currentPlan: account.planName, availablePlans: PLAN_CATALOG };
    case 'account':
      return { serviceAddress: account.serviceAddress, serviceStatus: account.serviceStatus, planName: account.planName };
    case 'tech_triage':
      return { openTickets: account.openTickets, serviceStatus: account.serviceStatus };
    case 'scheduling':
      return { scheduledAppointments: account.scheduledAppointments, availableWindows: getAvailableWindows() };
    default:
      return { error: 'unsupported_intent' };
  }
}

function completeTransaction(input: Record<string, unknown>, session: InternalCallSession): ToolResult {
  const transactionType = String(input.transactionType ?? '');
  const details = (input.details ?? {}) as Record<string, unknown>;
  const confirmed = input.confirmed === true;

  if (!confirmed) {
    return { error: 'not_confirmed', message: 'The caller must explicitly confirm before this action can run.' };
  }

  const requiresFull = REQUIRES_FULL_VERIFICATION.has(transactionType);
  if (!session.identityVerified || (requiresFull && session.verificationLevel !== 'ani+kba')) {
    return { error: 'insufficient_verification', requiredLevel: requiresFull ? 'ani+kba' : 'ani' };
  }

  const account = session.accountId ? findAccountById(session.accountId) : undefined;
  if (!account) return { error: 'account_not_found' };

  switch (transactionType) {
    case 'make_payment': {
      const requested = typeof details.amount === 'number' ? details.amount : account.balanceDue;
      const amount = Math.min(requested, account.balanceDue);
      account.balanceDue = Math.max(0, account.balanceDue - amount);
      account.lastPaymentAmount = amount;
      account.lastPaymentDate = new Date().toISOString().slice(0, 10);
      session.transactionsCompleted.push(`Paid $${amount.toFixed(2)}`);
      return { success: true, amountPaid: amount, newBalance: account.balanceDue };
    }
    case 'change_plan': {
      const plan = findPlanByName(String(details.newPlanName ?? ''));
      if (!plan) return { error: 'plan_not_found' };
      account.planName = plan.name;
      account.planPrice = plan.price;
      session.transactionsCompleted.push(`Changed plan to ${plan.name}`);
      return { success: true, newPlan: plan.name, newPrice: plan.price };
    }
    case 'update_service_address': {
      const newAddress = String(details.newAddress ?? '');
      if (!newAddress) return { error: 'missing_address' };
      account.serviceAddress = newAddress;
      session.transactionsCompleted.push('Updated service address');
      return { success: true, newAddress };
    }
    case 'schedule_appointment': {
      const window = findWindowById(String(details.windowId ?? ''));
      if (!window) return { error: 'window_not_found' };
      const appointment = {
        id: `apt-${Date.now()}`,
        type: 'Technician visit',
        windowStart: window.windowStart,
        windowEnd: window.windowEnd,
        status: 'scheduled' as const,
      };
      account.scheduledAppointments.push(appointment);
      session.transactionsCompleted.push(`Scheduled appointment ${window.windowStart}`);
      return { success: true, appointment };
    }
    case 'cancel_appointment': {
      const appointmentId = String(details.appointmentId ?? '');
      const appointment = account.scheduledAppointments.find((a) => a.id === appointmentId);
      if (!appointment) return { error: 'appointment_not_found' };
      appointment.status = 'canceled';
      session.transactionsCompleted.push(`Canceled appointment ${appointmentId}`);
      return { success: true, appointmentId };
    }
    case 'log_tech_ticket': {
      const issueDescription = String(details.issueDescription ?? 'Unspecified issue');
      const ticket = { id: `tck-${Date.now()}`, issue: issueDescription, status: 'open' as const };
      account.openTickets.push(ticket);
      session.transactionsCompleted.push(`Logged tech ticket: ${issueDescription}`);
      return { success: true, ticket };
    }
    default:
      return { error: 'unknown_transaction_type' };
  }
}

function escalate(input: Record<string, unknown>, session: InternalCallSession): ToolResult {
  session.status = 'escalated';
  session.endedAt = new Date().toISOString();
  session.escalation = {
    reason: String(input.reason ?? 'unspecified'),
    summary: String(input.summary ?? ''),
    attemptedSteps: Array.isArray(input.attemptedSteps) ? input.attemptedSteps.map(String) : [],
    verifiedIdentity: session.identityVerified,
    verificationLevel: session.verificationLevel,
    callerName: session.callerName,
    accountId: session.accountId,
    intent: session.intent,
    callbackRequested: input.callbackRequested === true,
    escalatedAt: new Date().toISOString(),
  };
  return { escalated: true };
}

function closeCall(session: InternalCallSession): ToolResult {
  if (session.status !== 'escalated') {
    session.status = 'ended';
    session.endedAt = new Date().toISOString();
  }
  return { closed: true };
}
