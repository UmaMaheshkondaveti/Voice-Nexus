import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ToastProvider } from './components/ui/Toast';
import { CallPage } from './pages/CallPage';
import { DashboardPage } from './pages/DashboardPage';
import { AgentHandoffPage } from './pages/AgentHandoffPage';
import { CallHistoryPage } from './pages/CallHistoryPage';
import { LiveCallsPage } from './pages/LiveCallsPage';
import { IntentsPage } from './pages/IntentsPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { WorkflowDetailPage } from './pages/WorkflowDetailPage';
import { AITestingPage } from './pages/AITestingPage';
import { VoiceAIConfigPage } from './pages/VoiceAIConfigPage';
import { LanguagesPage } from './pages/LanguagesPage';
import { PromptsPage } from './pages/PromptsPage';
import { AuthenticationPage } from './pages/AuthenticationPage';
import { GuardrailsPage } from './pages/GuardrailsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { CallAnalyticsPage } from './pages/CallAnalyticsPage';
import { AIAnalyticsPage } from './pages/AIAnalyticsPage';
import { CustomerExperiencePage } from './pages/CustomerExperiencePage';
import { CostPerformancePage } from './pages/CostPerformancePage';
import { UsersPage } from './pages/UsersPage';
import { RolesPermissionsPage } from './pages/RolesPermissionsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <ToastProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<CallPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calls" element={<CallHistoryPage />} />
          <Route path="/agent-handoff" element={<AgentHandoffPage />} />
          <Route path="/live-calls" element={<LiveCallsPage />} />
          <Route path="/intents" element={<IntentsPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
          <Route path="/ai-testing" element={<AITestingPage />} />
          <Route path="/config/voice" element={<VoiceAIConfigPage />} />
          <Route path="/config/languages" element={<LanguagesPage />} />
          <Route path="/config/prompts" element={<PromptsPage />} />
          <Route path="/config/authentication" element={<AuthenticationPage />} />
          <Route path="/config/guardrails" element={<GuardrailsPage />} />
          <Route path="/config/integrations" element={<IntegrationsPage />} />
          <Route path="/analytics/calls" element={<CallAnalyticsPage />} />
          <Route path="/analytics/ai" element={<AIAnalyticsPage />} />
          <Route path="/analytics/cx" element={<CustomerExperiencePage />} />
          <Route path="/analytics/cost" element={<CostPerformancePage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/roles" element={<RolesPermissionsPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="/admin/system-health" element={<SystemHealthPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    </ToastProvider>
  );
}
