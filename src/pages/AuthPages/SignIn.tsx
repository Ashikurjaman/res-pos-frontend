// src/pages/AuthPages/SignIn.tsx
import PageMeta from "../../components/common/PageMeta";
import SignInForm from "../../components/auth/SignInForm";
import AuthLayout from "./AuthPageLayout";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | Your App"
        description="Sign in to your account"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
