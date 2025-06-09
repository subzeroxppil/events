"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "./ui/card";
import { CircleAlert } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import Image from "next/image";
import { useUser } from "@/app/UserContext";
import Link from "next/link";

interface SignupFormProps {
  heading?: string;
  subheading?: string;
  signupText?: string;
  googleText?: string;
  loginText?: string;
  loginUrl?: string;
  className?: string;
  setDialogOpen?: (open: boolean) => void;
  setDialogModeToLogin?: () => void;
}

const SignupForm = ({
  heading = "Sign up",
  subheading = "Welcome to Paypal events portal!",
  googleText = "Sign up with Google",
  signupText = "Create an account",
  loginText = "Already have an account?",
  loginUrl = "/admin/login",
  className,
}: SignupFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { fetchUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Input validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const authorisationRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/checkAdmin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );

      const data = await authorisationRes.json();

      if (!data.authorized) {
        setError("Email account does not have access to admin portal");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const result = await res.json();
      if (res.ok) {
        await fetchUser();
        window.location.href = `/admin`;
      } else {
        setError(result.message || "Signup unsuccessful!");
        setLoading(false);
      }
    } catch (error) {
      setError("An error occurred, please try again");
      setLoading(false);
    }
  };

  return (
    <section className={`pt-10 pb-32 ${className ?? ""}`}>
      <div className="container">
        <div className="flex flex-col gap-4">
          <Card className="mx-auto w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center">
              <Image
                src="/paypal_logo.png"
                width="70"
                height="35"
                alt="standing nerd"
              />
              <p className="mb-2 text-2xl font-bold">{heading}</p>
              <p className="text-muted-foreground">{subheading}</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {error && (
                  <div className="flex gap-1">
                    <div>
                      <CircleAlert size="20px" color="#ef4444" />
                    </div>
                    <span className="text-sm text-red-500">{error}</span>
                  </div>
                )}
                <Button
                  type="submit"
                  className="mt-2 w-full"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner /> : signupText}
                </Button>
              </div>
            </form>
            <div className="mx-auto mt-1 flex justify-center gap-1 text-sm text-muted-foreground">
              <p>{loginText}</p>

              <Link href={loginUrl} className="font-medium text-primary">
                Login
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export { SignupForm };
