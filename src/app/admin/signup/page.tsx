import { SignupForm } from "@/components/SignupForm";
import { AuthLayout } from "@/components/AuthLayout";

export default function Page() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
