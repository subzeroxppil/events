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
import { signInWithOtp } from "./actions";

export default function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [timer, setTimer] = useState(0); // Initial timer value
  const [isActive, setIsActive] = useState(false);
  const [stage, setStage] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");

  const heading = "Admin Portal Login";
  const subheading =
    "We'll send you an OTP to log in securely. (Please check your junk mail if needed)";
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Input validation
    const authorizedAdmins = ["joshualai9922@gmail.com", "welai@paypal.com"];

    if (!authorizedAdmins.includes(email.trim())) {
      setError("Email account does not have access to admin portal");
      return;
    }

    setStage("otp");
    try {
      signInWithEmail(email.trim());
    } catch (error) {
      setError("An error occurred, please try again");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { session, error } = await signInWithOtp(email.trim(), otp.trim());
    if (error) {
      setError("Invalid or expired OTP. Please try again.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
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

            <form
              onSubmit={stage === "email" ? handleEmailSubmit : handleOtpSubmit}
            >
              <div className="flex flex-col space-y-1.5">
                {stage === "email" ? (
                  <>
                    <Label htmlFor="email">Paypal email</Label>
                    <Input
                      type="email"
                      id="email"
                      placeholder="eg: johndoe"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor="otp">OTP Code</Label>
                    <Input
                      id="otp"
                      placeholder="6-digit code"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </>
                )}
                {error && (
                  <div className="flex items-center gap-1">
                    <div>
                      <CircleAlert size="20px" color="#ef4444" />
                    </div>
                    <span className="text-sm text-red-500">{error}</span>
                  </div>
                )}
                {/* <Button
                  type="submit"
                  className="mt-2 w-full cursor-pointer"
                  disabled={timer > 0}
                >
                  {timer > 0
                    ? `Resend email${timer > 0 ? ` in ${timer} seconds` : ""}`
                    : submitText}
                </Button> */}
                <Button
                  type="submit"
                  className="mt-2 w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner />
                  ) : stage === "email" ? (
                    "Send Code"
                  ) : (
                    "Verify Code"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
