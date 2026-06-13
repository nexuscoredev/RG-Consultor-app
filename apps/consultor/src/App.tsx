import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { PageTransition } from '@/components/PageTransition';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SyncProvider } from '@/context/SyncContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppShell } from '@/layouts/AppShell';
import { AgendaPage } from '@/pages/AgendaPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { CommercialHubPage } from '@/pages/CommercialHubPage';
import { HomePage } from '@/pages/HomePage';
import { InstallPage } from '@/pages/InstallPage';
import { LoginPage } from '@/pages/LoginPage';
import { PipelinePage } from '@/pages/PipelinePage';
import { ProposalPage } from '@/pages/ProposalPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { MasterPage } from '@/pages/MasterPage';
import { ToolPage } from '@/pages/ToolPage';
import { VisitSessionPage } from '@/pages/VisitSessionPage';

function Protected({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <AppLoadingScreen />;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/instalar" element={<InstallPage />} />
      <Route
        element={
          <Protected>
            <AppShell />
          </Protected>
        }>
        <Route
          index
          element={
            <PageTransition>
              <HomePage />
            </PageTransition>
          }
        />
        <Route
          path="agenda"
          element={
            <PageTransition>
              <AgendaPage />
            </PageTransition>
          }
        />
        <Route
          path="comercial"
          element={
            <PageTransition>
              <CommercialHubPage />
            </PageTransition>
          }
        />
        <Route
          path="comercial/pipeline"
          element={
            <PageTransition>
              <PipelinePage />
            </PageTransition>
          }
        />
        <Route
          path="comercial/clientes"
          element={
            <PageTransition>
              <ClientsPage />
            </PageTransition>
          }
        />
        <Route
          path="comercial/proposta"
          element={
            <PageTransition>
              <ProposalPage />
            </PageTransition>
          }
        />
        <Route
          path="comercial/visita"
          element={
            <PageTransition>
              <VisitSessionPage />
            </PageTransition>
          }
        />
        <Route
          path="comercial/:slug"
          element={
            <PageTransition>
              <ToolPage />
            </PageTransition>
          }
        />
        <Route
          path="master"
          element={
            <PageTransition>
              <MasterPage />
            </PageTransition>
          }
        />
        <Route
          path="configuracoes"
          element={
            <PageTransition>
              <SettingsPage />
            </PageTransition>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SyncProvider>
              <AppRoutes />
            </SyncProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
