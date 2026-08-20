import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { hasStudyPlan } from "../../utils/storage";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireStudyPlan?: boolean;
}

export default function ProtectedRoute({ children, requireStudyPlan = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
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
