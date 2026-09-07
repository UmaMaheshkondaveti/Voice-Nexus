import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  PhoneCall,
  History,
  ArrowUpRight,
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

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  implemented: boolean;
  phase?: number;
  end?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, implemented: true }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Live Calls', path: '/live-calls', icon: Activity, implemented: true },
      { label: 'Call History', path: '/calls', icon: History, implemented: true },
      { label: 'Escalations', path: '/agent-handoff', icon: ArrowUpRight, implemented: true },
    ],
  },
  {
    label: 'AI & Automation',
    items: [
      { label: 'Intents', path: '/intents', icon: Brain, implemented: true },
      { label: 'Workflows', path: '/workflows', icon: GitBranch, implemented: true },
      { label: 'AI Testing', path: '/ai-testing', icon: FlaskConical, implemented: true },
      { label: 'Call Simulator', path: '/', icon: PhoneCall, implemented: true, end: true },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Voice & AI', path: '/config/voice', icon: Mic, implemented: true },
      { label: 'Languages', path: '/config/languages', icon: Languages, implemented: true },
      { label: 'Prompts', path: '/config/prompts', icon: FileText, implemented: true },
      { label: 'Authentication', path: '/config/authentication', icon: KeyRound, implemented: true },
      { label: 'Guardrails', path: '/config/guardrails', icon: ShieldAlert, implemented: true },
      { label: 'Integrations', path: '/config/integrations', icon: Plug, implemented: true },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Call Analytics', path: '/analytics/calls', icon: BarChart3, implemented: true },
      { label: 'AI Analytics', path: '/analytics/ai', icon: Brain, implemented: true },
      { label: 'Customer Experience', path: '/analytics/cx', icon: Smile, implemented: true },
      { label: 'Cost & Performance', path: '/analytics/cost', icon: DollarSign, implemented: true },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users', path: '/admin/users', icon: Users, implemented: true },
      { label: 'Roles & Permissions', path: '/admin/roles', icon: ShieldCheck, implemented: true },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText, implemented: true },
      { label: 'System Health', path: '/admin/system-health', icon: HeartPulse, implemented: true },
      { label: 'Settings', path: '/admin/settings', icon: Settings, implemented: true },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
