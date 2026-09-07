import type { AuditLogEntry, ModulePermission, PlatformUser, RoleDefinition, UserRole } from '../types/admin';

/*
 * Mock administration layer (Users, Roles & Permissions, Audit Logs).
 * Same swap-point pattern as analyticsService.ts / configService.ts.
 */

function delay(ms = 220): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const ROLES: UserRole[] = ['Administrator', 'Operations Manager', 'Agent', 'Analyst', 'Developer'];

let users: PlatformUser[] = [
  { id: 'u-1', name: 'Priya Anand', email: 'priya.anand@voicenexus.example', role: 'Administrator', status: 'active', lastActive: '2026-09-07T17:40:00Z' },
  { id: 'u-2', name: 'Marcus Webb', email: 'marcus.webb@voicenexus.example', role: 'Operations Manager', status: 'active', lastActive: '2026-09-07T16:10:00Z' },
  { id: 'u-3', name: 'Dana Lin', email: 'dana.lin@voicenexus.example', role: 'Analyst', status: 'active', lastActive: '2026-09-06T12:05:00Z' },
  { id: 'u-4', name: 'Tomás Herrera', email: 'tomas.herrera@voicenexus.example', role: 'Developer', status: 'active', lastActive: '2026-09-05T09:22:00Z' },
  { id: 'u-5', name: 'Grace Okafor', email: 'grace.okafor@voicenexus.example', role: 'Agent', status: 'disabled', lastActive: '2026-08-20T08:00:00Z' },
];

export async function getUsers(): Promise<PlatformUser[]> {
  await delay();
  return users;
}

export async function createUser(data: Omit<PlatformUser, 'id' | 'lastActive'>): Promise<PlatformUser> {
  await delay();
  const created: PlatformUser = { ...data, id: uid('u'), lastActive: new Date().toISOString() };
  users = [...users, created];
  return created;
}

export async function updateUser(id: string, patch: Partial<PlatformUser>): Promise<void> {
  await delay(200);
  users = users.map((u) => (u.id === id ? { ...u, ...patch } : u));
}

export async function deleteUser(id: string): Promise<void> {
  await delay(200);
  users = users.filter((u) => u.id !== id);
}

const MODULES = ['Dashboard', 'Live Calls', 'Intents', 'Workflows', 'Voice & AI', 'Integrations', 'Analytics', 'Administration'];

function defaultPermissions(role: UserRole): ModulePermission[] {
  const full = role === 'Administrator';
  const opsManager = role === 'Operations Manager';
  const analyst = role === 'Analyst';
  return MODULES.map((module) => {
    if (full) return { module, view: true, edit: true };
    if (opsManager) return { module, view: true, edit: !['Administration'].includes(module) };
    if (analyst) return { module, view: true, edit: false };
    if (role === 'Developer') return { module, view: true, edit: ['Intents', 'Workflows', 'Voice & AI', 'Integrations'].includes(module) };
    // Agent
    return { module, view: ['Dashboard', 'Live Calls'].includes(module), edit: false };
  });
}

let roles: RoleDefinition[] = ROLES.map((role) => ({
  role,
  description:
    role === 'Administrator'
      ? 'Full access to every module, including administration and security settings.'
      : role === 'Operations Manager'
        ? 'Manages day-to-day operations, workflows, and configuration; no user administration.'
        : role === 'Agent'
          ? 'Handles escalated calls; view-only access to live operations.'
          : role === 'Analyst'
            ? 'Read-only access across analytics and operational data.'
            : 'Builds and tests intents, workflows, and integrations.',
  permissions: defaultPermissions(role),
}));

export async function getRoles(): Promise<RoleDefinition[]> {
  await delay();
  return roles;
}

export async function updateRolePermission(role: UserRole, module: string, patch: Partial<ModulePermission>): Promise<void> {
  await delay(200);
  roles = roles.map((r) =>
    r.role === role ? { ...r, permissions: r.permissions.map((p) => (p.module === module ? { ...p, ...patch } : p)) } : r,
  );
}

const ACTIONS = ['Updated intent', 'Published workflow', 'Signed in', 'Changed guardrail setting', 'Rolled back workflow', 'Disabled user', 'Updated prompt', 'Tested integration'];
const RESOURCES = ['Intent: Billing Inquiry', 'Workflow: Internet Troubleshooting', 'Session', 'Guardrails config', 'Workflow: Plan Change', 'User: Grace Okafor', 'Prompt: Greeting', 'Integration: OSS/BSS'];

let auditLog: AuditLogEntry[] | null = null;

function ensureAuditLog(): AuditLogEntry[] {
  if (!auditLog) {
    auditLog = Array.from({ length: 60 }, (_, i) => {
      const minutesAgo = i * 47 + Math.floor(Math.random() * 30);
      const idx = i % ACTIONS.length;
      const failed = Math.random() < 0.08;
      return {
        id: uid('log'),
        user: users[i % users.length]?.name ?? 'System',
        action: ACTIONS[idx],
        resource: RESOURCES[idx],
        timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
        result: failed ? 'failure' : 'success',
        errorDetail: failed ? 'Permission denied' : undefined,
      };
    });
  }
  return auditLog;
}

export interface AuditLogFilters {
  search?: string;
  result?: 'success' | 'failure';
}

export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogEntry[]> {
  await delay();
  let rows = ensureAuditLog();
  if (filters.result) rows = rows.filter((r) => r.result === filters.result);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter((r) => r.user.toLowerCase().includes(q) || r.action.toLowerCase().includes(q) || r.resource.toLowerCase().includes(q));
  }
  return [...rows].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
