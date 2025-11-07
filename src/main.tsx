import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GuideProvider } from './contexts/GuideContext'
import { SectorMapProvider } from './contexts/SectorMapContext'
import { DiscoveryProvider } from './contexts/DiscoveryContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectPage } from './pages/ProjectPage'
import { AdminPage } from './pages/AdminPage'
import { AdminUserDetail } from './pages/AdminUserDetail'
import { AdminProjectDetail } from './pages/AdminProjectDetail'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <GuideProvider>
          <SectorMapProvider>
            <DiscoveryProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public route */}
                  <Route path="/login" element={<LoginPage />} />

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
            </DiscoveryProvider>
          </SectorMapProvider>
        </GuideProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
