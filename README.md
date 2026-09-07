# VoiceNexus — Conversational IVR Demo

A working demo of the VoiceNexus AI IVR concept from the PRD: talk to an AI customer-care agent by voice, watch it verify your identity, work a billing/plan/account/tech/scheduling request, confirm before committing an irreversible action, and either resolve the call or escalate it to a live agent — with the results showing up on an ops dashboard and an agent-handoff view.

Real SIP/PSTN telephony, a real billing/OSS/BSS system, a real ACD, and a real identity provider aren't available outside a live carrier environment, so those layers are simulated:

- **Voice I/O** uses the browser's native Web Speech API (Chrome/Edge) — no external speech vendor.
- **NLU/dialogue** is powered by the real Anthropic API (Claude), using tool calls to keep the agent grounded and goal-directed rather than freely hallucinating.
- **Account/billing/scheduling data** is an in-memory mock store (`backend/src/data/`), reset on backend restart.
- **Live-agent transfer** is simulated as the Agent Handoff dashboard page — no real call transfer occurs.

## Prerequisites

- **Node.js 20+** and npm. This machine didn't have Node installed while building this project — install it from [nodejs.org](https://nodejs.org) (or `winget install OpenJS.NodeJS.LTS`) before running the steps below.
- An **Anthropic API key** (`ANTHROPIC_API_KEY`).
- **Chrome or Edge** for real voice input/output (Web Speech API). Other browsers fall back to a text input.

## Setup

```powershell
cd backend
npm install
Copy-Item .env.example .env
# edit backend/.env and set ANTHROPIC_API_KEY

cd ../frontend
npm install
```

## Run

In one terminal:

```powershell
cd backend
npm run dev        # http://localhost:4000
```

In another terminal:

```powershell
cd frontend
npm run dev         # http://localhost:5173, proxies /api to the backend
```

Open `http://localhost:5173` in Chrome or Edge.

## Try it — golden path

1. **Call page** (`/`) — pick a demo account (e.g. Priya Nair) from the dropdown → **Start Call**. The greeting plays out loud.
2. Say (or type) *"I want to check my bill."* The agent verifies your identity from the calling number automatically and states your real balance from the mock account data.
3. Say *"I'd like to pay it in full."* Since payment is irreversible, the agent asks a knowledge-based question — answer it (see the fixture table below), confirm the amount when asked, and the payment completes. Toggle **Show technical detail** in the transcript to see the tool calls and mock-data mutations.
4. End the call. Check the **Dashboard** (`/dashboard`) — total calls, containment rate, AHT, and intent distribution should update.

## Try it — escalation path

1. Start a call as **Unknown number**.
2. Say *"I want to talk to a human about a legal dispute."* The agent transfers the call.
3. Open **Agent Handoff** (`/agent-handoff`) — the call appears with its verified-identity status, intent, reason, and attempted steps.
4. Dashboard transfer rate and escalation reasons reflect it.

## Demo account fixtures

| Name | Phone | KBA question | KBA answer |
|---|---|---|---|
| Priya Nair | +14085550101 | What city were you born in? | Chicago |
| Marcus Webb | +14085550102 | What is the name of your first pet? | Rusty |
| Dana Ferreira | +14085550103 | What is your mother's maiden name? | O'Connor |
| Leo Tran | +14085550104 | What was the model of your first car? | Civic |
| Ingrid Solberg | +14085550105 | What street did you grow up on? | Elm |

(See `backend/src/data/accounts.ts` for full account details.)

## Scope notes

Out of scope per the PRD's own v1 exclusions: outbound/proactive calls, cross-channel continuity with other NforceOne products, voice biometrics, real-time sentiment-based escalation.

Not built for this demo: configurable brand voice / per-tenant prompts (VN-7/VN-9), a real-time agent-assist overlay (VN-10), and the engineering/admin configuration persona. Callback scheduling (VN-8) is folded into the escalation payload's `callbackRequested` flag rather than a full scheduling subsystem.
