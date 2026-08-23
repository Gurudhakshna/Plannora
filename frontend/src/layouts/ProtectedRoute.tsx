import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { hasStudyPlan } from "../utils/storage";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import type { ReactNode } from "react";

export interface ProtectedRouteProps {
  children: ReactNode;
  requireStudyPlan?: boolean;
}

export default function ProtectedRoute({
  children,
  requireStudyPlan = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-base)" }}>
        <LoadingSpinner size="lg" message="Loading your workspace..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireStudyPlan && !hasStudyPlan(user.uid)) {
    return <Navigate to="/setup-study-plan" replace />;
  }

  return <>{children}</>;
}
