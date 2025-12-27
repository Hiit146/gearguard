import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage, RegisterPage } from "./components/auth/AuthPages";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { EquipmentList } from "./components/equipment/EquipmentList";
import { EquipmentDetail } from "./components/equipment/EquipmentDetail";
import { TeamsList } from "./components/teams/TeamsList";
import { RequestKanban } from "./components/requests/RequestKanban";
import { RequestCalendar } from "./components/requests/RequestCalendar";
import { ReportsPage } from "./components/reports/ReportsPage";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route 
                path="/login" 
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                } 
            />
            <Route 
                path="/register" 
                element={
                    <PublicRoute>
                        <RegisterPage />
                    </PublicRoute>
                } 
            />

            {/* Protected Routes */}
            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/equipment" 
                element={
                    <ProtectedRoute>
                        <EquipmentList />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/equipment/:id" 
                element={
                    <ProtectedRoute>
                        <EquipmentDetail />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/teams" 
                element={
                    <ProtectedRoute>
                        <TeamsList />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/requests" 
                element={
                    <ProtectedRoute>
                        <RequestKanban />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/calendar" 
                element={
                    <ProtectedRoute>
                        <RequestCalendar />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/reports" 
                element={
                    <ProtectedRoute>
                        <ReportsPage />
                    </ProtectedRoute>
                } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster 
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#18181b',
                            border: '1px solid #27272a',
                            color: '#fafafa',
                        },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
