import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GuideProvider } from './contexts/GuideContext'
import { SectorMapProvider } from './contexts/SectorMapContext'
import { DiscoveryProvider } from './contexts/DiscoveryContext'
import { PivotProvider } from './contexts/PivotContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { TermsOfServicePage } from './pages/TermsOfServicePage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectPage } from './pages/ProjectPage'
import { DiscoveryPage } from './pages/DiscoveryPage'
import { Step0Page } from './pages/Step0Page'
import QuickCheckPage from './features/quickcheck/QuickCheckPage'
import { QuickCheckReportPage } from './pages/QuickCheckReportPage'
import { SectorMapPage } from './pages/SectorMapPage'
import { UserSettingsPage } from './pages/UserSettingsPage'
import { AdminPage } from './pages/AdminPage'
import { AdminUserDetail } from './pages/AdminUserDetail'
import { AdminProjectDetail } from './pages/AdminProjectDetail'
import { AdminNewsletter } from './pages/AdminNewsletter'
import { AdminReports } from './pages/AdminReports'
import { OrganizationSettingsPage } from './pages/OrganizationSettingsPage'
import { initSentry } from './lib/sentry'
import './index.css'

// Initialize Sentry error tracking
initSentry();

// Sanity Check is now Part 2 of Quick Check; redirect any old links.
function SanityCheckRedirect() {
  const { projectId } = useParams<{ projectId: string }>();
  return <Navigate to={`/project/${projectId}/quick-check`} replace />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <GuideProvider>
          <SectorMapProvider>
            <DiscoveryProvider>
              <PivotProvider>
                <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/terms" element={<TermsOfServicePage />} />

                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/project/:projectId"
                    element={
                      <ProtectedRoute>
                        <ProjectPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/project/:projectId/discovery"
                    element={
                      <ProtectedRoute>
                        <DiscoveryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/project/:projectId/discovery/step-0"
                    element={
                      <ProtectedRoute>
                        <Step0Page />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/project/:projectId/quick-check"
                    element={
                      <ProtectedRoute>
                        <QuickCheckPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/project/:projectId/quick-check/report"
                    element={
                      <ProtectedRoute>
                        <QuickCheckReportPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/project/:projectId/sanity-check"
                    element={
                      <ProtectedRoute>
                        <SanityCheckRedirect />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/project/:projectId/sector-map"
                    element={
                      <ProtectedRoute>
                        <SectorMapPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <UserSettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/team"
                    element={
                      <ProtectedRoute>
                        <OrganizationSettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin routes - require admin privileges */}
                  <Route
                    path="/admin"
                    element={
                      <AdminProtectedRoute>
                        <AdminPage />
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/newsletter"
                    element={
                      <AdminProtectedRoute>
                        <AdminNewsletter />
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/reports"
                    element={
                      <AdminProtectedRoute>
                        <AdminReports />
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/user/:userId"
                    element={
                      <AdminProtectedRoute>
                        <AdminUserDetail />
                      </AdminProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/project/:projectId"
                    element={
                      <AdminProtectedRoute>
                        <AdminProjectDetail />
                      </AdminProtectedRoute>
                    }
                  />

                  {/* Redirect root to dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />

                  {/* 404 - redirect to dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </BrowserRouter>
              </PivotProvider>
            </DiscoveryProvider>
          </SectorMapProvider>
        </GuideProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
