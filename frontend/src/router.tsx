import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./layouts/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import LoadingSpinner from "./components/shared/LoadingSpinner";

// Auth Pages (Eager or Lazy)
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));

// Onboarding
const OnboardingPage = lazy(() => import("./pages/onboarding/OnboardingPage"));

// Feature Pages
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const StudyPlanPage = lazy(() => import("./features/study-plan/StudyPlanPage"));
const MaterialsPage = lazy(() => import("./features/materials/MaterialsPage"));
const TasksPage = lazy(() => import("./features/tasks/TasksPage"));
const CalendarPage = lazy(() => import("./features/calendar/CalendarPage"));
const ProgressPage = lazy(() => import("./features/progress/ProgressPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// AI Tool Pages
const ConceptMapPage = lazy(() => import("./features/ai-tools/concept-map/ConceptMapPage"));
const FlashcardsPage = lazy(() => import("./features/ai-tools/flashcards/FlashcardsPage"));
const PomodoroPage = lazy(() => import("./features/ai-tools/pomodoro/PomodoroPage"));
const QuizPage = lazy(() => import("./features/ai-tools/quiz/QuizPage"));
const WeakTopicsPage = lazy(() => import("./features/ai-tools/weak-topics/WeakTopicsPage"));

const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function PageLoader() {
  return (
    <div style={{ padding: 48, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
      <LoadingSpinner size="md" message="Loading page..." />
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Authentication Routes */}
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthLayout>
              <ForgotPasswordPage />
            </AuthLayout>
          }
        />

        {/* Onboarding Wizard */}
        <Route
          path="/setup-study-plan"
          element={
            <ProtectedRoute requireStudyPlan={false}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requireStudyPlan={false}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Workspace Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="study-plan" element={<StudyPlanPage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* AI Tools */}
          <Route path="ai/concept-map" element={<ConceptMapPage />} />
          <Route path="ai/flashcards" element={<FlashcardsPage />} />
          <Route path="ai/pomodoro" element={<PomodoroPage />} />
          <Route path="ai/quiz" element={<QuizPage />} />
          <Route path="ai/weak-topics" element={<WeakTopicsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
