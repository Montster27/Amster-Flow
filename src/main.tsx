import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GuideProvider } from './contexts/GuideContext'
import { SectorMapProvider } from './contexts/SectorMapContext'
import { DiscoveryProvider } from './contexts/DiscoveryContext'
import { PivotProvider } from './contexts/PivotContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import { TermsOfServicePage } from './pages/TermsOfServicePage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectPage } from './pages/ProjectPage'
import { AdminPage } from './pages/AdminPage'
import { AdminUserDetail } from './pages/AdminUserDetail'
import { AdminProjectDetail } from './pages/AdminProjectDetail'
import { initSentry } from './lib/sentry'
import './index.css'

// Initialize Sentry error tracking
initSentry();

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

                  {/* Admin routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/user/:userId"
                    element={
                      <ProtectedRoute>
                        <AdminUserDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/project/:projectId"
                    element={
                      <ProtectedRoute>
                        <AdminProjectDetail />
                      </ProtectedRoute>
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
