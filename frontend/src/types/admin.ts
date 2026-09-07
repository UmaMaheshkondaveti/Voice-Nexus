export type UserRole = 'Administrator' | 'Operations Manager' | 'Agent' | 'Analyst' | 'Developer';

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'disabled';
  lastActive: string;
}

export interface ModulePermission {
  module: string;
  view: boolean;
  edit: boolean;
}

export interface RoleDefinition {
  role: UserRole;
  description: string;
  permissions: ModulePermission[];
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  result: 'success' | 'failure';
  errorDetail?: string;
}
