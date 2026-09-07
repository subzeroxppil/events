import { SignupForm } from "@/components/SignupForm";

import { PageTransition } from "@/components/PageTransition";
export default function Page() {
  return (
    <PageTransition className="flex min-h-svh w-full justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </PageTransition>
  );
}
