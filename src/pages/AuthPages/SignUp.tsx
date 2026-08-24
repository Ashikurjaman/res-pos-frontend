// src/pages/AuthPages/SignUp.tsx
import PageMeta from "../../components/common/PageMeta";

import SignUpForm from "../../components/auth/SignUpForm";
import AuthLayout from "./AuthPageLayout";

export default function SignUp() {
  return (
    <>
      <PageMeta title="Sign Up | Your App" description="Create a new account" />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
