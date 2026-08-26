// src/pages/AuthPages/SignUp.tsx
import PageMeta from "../../components/common/PageMeta";
import SignUpForm from "../../components/auth/SignUpForm";
import AuthLayout from "./AuthPageLayout";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Sign Up | A&T POS"
        description="Create a new account to get started"
      />
      <AuthLayout
        title="Create Account"
        subtitle="Join us and get started with your journey"
      >
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
