import AuthLayout from "../layouts/AuthLayout";
import LoginPage from "./auth/LoginPage";

export default function Login() {
  return (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  );
}
