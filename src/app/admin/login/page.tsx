"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CircleAlert } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { signInWithEmail } from "./actions";

export default function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [timer, setTimer] = useState(0); // Initial timer value
  const [isActive, setIsActive] = useState(false);

  const heading = "Admin Portal Login";
  const subheading = "We'll send you a link to log in securely.";
  const submitText = "Send link";

  const startTimer = () => {
    setTimer(60);
    setIsActive(true);
  };

  useEffect(() => {
    let intervalId: string | number | NodeJS.Timeout | undefined;
    // Only start countdown if timer is greater than 0 and isActive is true
    if (isActive && timer > 0) {
      intervalId = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }

    // Cleanup interval on component unmount or when timer reaches 0
    return () => clearInterval(intervalId);
  }, [isActive, timer]); // Dependencies include isActive and timer

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Input validation
    if (!email.includes("joshualai9922@gmail.com")) {
      setError("Email account does not have access");
      return;
    }

    setLoading(true);
    try {
      signInWithEmail(email);
      startTimer();
    } catch (error) {
      setError("An error occurred, please try again");
      setLoading(false);
    }
  };
  return (
    <div className="flex w-full justify-center p-6 md:p-10 h-full">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-4">
          <Card className="mx-auto w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center">
              <Image
                src="/paypal_logo.png"
                width={60}
                height={60}
                alt="paypal icon"
              />
              <p className="mb-2 text-2xl font-bold">{heading}</p>
              <p className="text-muted-foreground">{subheading}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Paypal email</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="eg: johndoe"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
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
                  className="mt-2 w-full cursor-pointer"
                  disabled={timer > 0}
                >
                  {/* {loading ? {`Resend email{timer > 0 && ` in ${timer} seconds`}`} : submitText} */}
                  {timer > 0
                    ? `Resend email${timer > 0 ? ` in ${timer} seconds` : ""}`
                    : submitText}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
