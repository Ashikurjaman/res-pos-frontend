// src/pages/AuthPages/SignIn.tsx
import PageMeta from "../../components/common/PageMeta";
import SignInForm from "../../components/auth/SignInForm";
import AuthLayout from "./AuthPageLayout";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | A&T POS"
        description="Sign in to your account to access the dashboard"
      />
      <AuthLayout
        title="Welcome Back"
        subtitle="Sign in to your account to continue"
      >
        <SignInForm />
      </AuthLayout>
    </>
  );
}
