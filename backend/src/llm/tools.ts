import type OpenAI from 'openai';

export const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'verify_identity',
      description:
        "Verify the caller's identity via ANI (their calling phone number) match, optionally strengthened with a knowledge-based answer (KBA). Call this before revealing or changing any account-specific information. Read-only account questions only need an ANI match; payments, plan changes, address changes, and cancellations need ANI + a correct KBA answer. If the phone number does not match any account, tell the caller and offer to transfer them.",
      parameters: {
        type: 'object',
        properties: {
          phoneNumber: { type: 'string', description: 'The phone number the caller is calling from, in E.164 format (e.g. +14085550101).' },
          kbaAnswer: { type: 'string', description: "The caller's answer to the account's knowledge-based question, if one was asked." },
        },
        required: ['phoneNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_account',
      description:
        "Retrieve the verified caller's account details (plan, balance, last payment, service address, appointments, open tickets). Requires prior successful identity verification. Never state an account fact you did not get from this tool.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'start_subflow',
      description:
        'Begin a goal-directed subflow for one supported customer-care intent, after identity is verified. Returns grounded, subflow-specific data to work from (available plans, appointment windows, etc.) — never state facts about these that did not come from a tool result.',
      parameters: {
        type: 'object',
        properties: {
          intent: {
            type: 'string',
            enum: ['billing', 'plan_change', 'account', 'tech_triage', 'scheduling'],
            description: 'The customer-care intent to start a subflow for.',
          },
        },
        required: ['intent'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_transaction',
      description:
        'Execute and commit one transaction in the active subflow. Irreversible actions (payments, plan changes, address changes, cancellations) require the caller to have explicitly confirmed in conversation, and require full identity verification (ANI + KBA). Only call with confirmed:true after the caller has said yes to your restated summary of what will happen.',
      parameters: {
        type: 'object',
        properties: {
          transactionType: {
            type: 'string',
            enum: ['make_payment', 'change_plan', 'update_service_address', 'schedule_appointment', 'cancel_appointment', 'log_tech_ticket'],
          },
          details: {
            type: 'object',
            description:
              'Type-specific fields: {amount} for make_payment (omit or set to the full balance to pay in full), {newPlanName} for change_plan, {newAddress} for update_service_address, {windowId} for schedule_appointment, {appointmentId} for cancel_appointment, {issueDescription} for log_tech_ticket.',
          },
          confirmed: { type: 'boolean', description: 'True only if the caller has explicitly confirmed this exact action.' },
        },
        required: ['transactionType', 'details', 'confirmed'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalate',
      description:
        'Transfer the call to a live agent with a structured handoff. Use when: the request is out of the 5 supported intents; the caller asks for a human; identity verification has failed twice; a fraud/dispute/legal concern is raised; or you cannot resolve a tool error. After calling this, say a brief closing line to the caller — do not keep troubleshooting.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'A short machine-readable reason code, e.g. out_of_scope, caller_requested_human, kba_failed_twice, fraud_dispute, tool_error.' },
          summary: { type: 'string', description: 'One or two sentences a live agent can read in 5 seconds.' },
          attemptedSteps: { type: 'array', items: { type: 'string' }, description: 'What was already tried or established on this call.' },
          callbackRequested: { type: 'boolean', description: 'Whether the caller asked for a callback instead of waiting.' },
        },
        required: ['reason', 'summary', 'attemptedSteps'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_call',
      description: "Close the call once the caller's needs are met and they've indicated they're done. Say a brief closing line first.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];
