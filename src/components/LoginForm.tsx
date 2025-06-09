"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "./ui/card";
import { LoadingSpinner } from "./LoadingSpinner";
import { CircleAlert } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/app/UserContext";
import Link from "next/link";

interface LoginFormProps {
  heading?: string;
  subheading?: string;
  loginText?: string;
  googleText?: string;
  signupText?: string;
  signupUrl?: string;
  className?: string;
  setDialogOpen?: (open: boolean) => void;
  setDialogModeToSignup?: () => void;
}

const LoginForm = ({
  heading = "Login",
  subheading = "Welcome back!",
  loginText = "Login",
  signupText = "Don't have an account?",
  signupUrl = "/admin/signup",
  className,
}: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { fetchUser } = useUser();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include", // Ensures cookies are included
        }
      );

      const result = await res.json();

      if (res.ok) {
        await fetchUser();
        router.push(`${process.env.NEXT_PUBLIC_BASE_URL}/admin`);
      } else {
        setError(result.message || "Invalid email or password");
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
            <div className="mb-6 flex flex-col items-center text-center">
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
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-1">
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
                  {loading ? <LoadingSpinner /> : loginText}
                </Button>
              </div>
              <div className="mx-auto mt-8 flex justify-center gap-1 text-sm text-muted-foreground">
                <p>{signupText}</p>

                <Link href={signupUrl} className="font-medium text-primary">
                  Sign up
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};

export { LoginForm };
