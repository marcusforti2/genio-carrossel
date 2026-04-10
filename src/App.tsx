import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfileComplete } from "@/hooks/useProfileComplete";
import { useAdmin } from "@/hooks/useAdmin";
import React, { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const CarouselEditor = lazy(() => import("./pages/CarouselEditor"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ApiDocsPage = lazy(() => import("./pages/ApiDocsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const LoadingScreen = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
));
LoadingScreen.displayName = "LoadingScreen";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isComplete, loading: profileLoading } = useProfileComplete();

  if (loading || profileLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (isComplete === false) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isComplete, loading: profileLoading } = useProfileComplete();

  if (loading || profileLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (isComplete === true) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  if (loading || adminLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/editor" element={<ProtectedRoute><CarouselEditor /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/api" element={<ProtectedRoute><ApiDocsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
