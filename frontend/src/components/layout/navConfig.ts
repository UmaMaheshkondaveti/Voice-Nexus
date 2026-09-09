import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  PhoneCall,
  History,
  ArrowUpRight,
  PhoneForwarded,
  Brain,
  GitBranch,
  FlaskConical,
  Mic,
  Languages,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Plug,
  BarChart3,
  Activity,
  Smile,
  DollarSign,
  Users,
  KeyRound,
  ScrollText,
  HeartPulse,
  Settings,
} from 'lucide-react';
import type { Role } from '../../auth/AuthContext';

const ALL_ROLES: Role[] = ['agent', 'operations', 'admin'];
const OPS_AND_ADMIN: Role[] = ['operations', 'admin'];
const ADMIN_ONLY: Role[] = ['admin'];

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  implemented: boolean;
  phase?: number;
  end?: boolean;
  /** Which signed-in roles see this item and may open its route. Defaults to everyone. */
  roles?: Role[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, implemented: true, roles: ALL_ROLES }],
  },
  {
    label: 'Customer Voice Experience',
    items: [{ label: 'Call Simulator', path: '/', icon: PhoneCall, implemented: true, end: true, roles: ALL_ROLES }],
  },
  {
    label: 'Contact Center',
    items: [
      { label: 'Live Calls', path: '/live-calls', icon: Activity, implemented: true, roles: ALL_ROLES },
      { label: 'Call History', path: '/calls', icon: History, implemented: true, roles: ALL_ROLES },
      { label: 'Escalations', path: '/escalations', icon: ArrowUpRight, implemented: true, roles: ALL_ROLES },
      { label: 'Agent Workspace', path: '/agent-handoff', icon: PhoneForwarded, implemented: true, roles: ALL_ROLES },
    ],
  },
  {
    label: 'AI & Automation',
    items: [
      { label: 'Intents', path: '/intents', icon: Brain, implemented: true, roles: OPS_AND_ADMIN },
      { label: 'Workflows', path: '/workflows', icon: GitBranch, implemented: true, roles: OPS_AND_ADMIN },
      { label: 'AI Testing', path: '/ai-testing', icon: FlaskConical, implemented: true, roles: OPS_AND_ADMIN },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Voice & AI', path: '/config/voice', icon: Mic, implemented: true, roles: OPS_AND_ADMIN },
      { label: 'Languages', path: '/config/languages', icon: Languages, implemented: true, roles: OPS_AND_ADMIN },
      { label: 'Prompts', path: '/config/prompts', icon: FileText, implemented: true, roles: OPS_AND_ADMIN },
      { label: 'Authentication', path: '/config/authentication', icon: KeyRound, implemented: true, roles: OPS_AND_ADMIN },
      { label: 'Guardrails', path: '/config/guardrails', icon: ShieldAlert, implemented: true, roles: OPS_AND_ADMIN },
      { label: 'Integrations', path: '/config/integrations', icon: Plug, implemented: true, roles: OPS_AND_ADMIN },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Call Analytics', path: '/analytics/calls', icon: BarChart3, implemented: true, roles: OPS_AND_ADMIN },
      { label: 'AI Analytics', path: '/analytics/ai', icon: Brain, implemented: true, roles: OPS_AND_ADMIN },
      { label: 'Customer Experience', path: '/analytics/cx', icon: Smile, implemented: true, roles: OPS_AND_ADMIN },
      { label: 'Cost & Performance', path: '/analytics/cost', icon: DollarSign, implemented: true, roles: OPS_AND_ADMIN },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users', path: '/admin/users', icon: Users, implemented: true, roles: ADMIN_ONLY },
      { label: 'Roles & Permissions', path: '/admin/roles', icon: ShieldCheck, implemented: true, roles: ADMIN_ONLY },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText, implemented: true, roles: ADMIN_ONLY },
      { label: 'System Health', path: '/admin/system-health', icon: HeartPulse, implemented: true, roles: OPS_AND_ADMIN },
      { label: 'Settings', path: '/admin/settings', icon: Settings, implemented: true, roles: ADMIN_ONLY },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function navGroupsForRole(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => (item.roles ?? ALL_ROLES).includes(role)),
  })).filter((group) => group.items.length > 0);
}

/** Route-level guard: is `pathname` one this role is allowed to open at all? */
export function isPathAllowedForRole(role: Role, pathname: string): boolean {
  return ALL_NAV_ITEMS.some((item) => {
    if (!(item.roles ?? ALL_ROLES).includes(role)) return false;
    if (item.end) return pathname === item.path;
    // Nested routes not in the nav (e.g. /workflows/:id) inherit their parent's permission.
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  });
}
