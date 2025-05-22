"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CircleAlert } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import onboardingAnimationData from "@/app/assets/handshake-animation.json";
import { Label } from "@/components/ui/label";
import Lottie from "lottie-react";

export default function Page() {
  const [workId, setWorkID] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const heading = "Lucky Draw";
  const subheading = "Get a free gift if you've attended our event!";
  const submitText = "Login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Input validation
    if (workId.includes("@")) {
      setError("Please enter your Corp Pass ID before the '@'");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/luckydraw/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workId }),
        }
      );

      const result = await res.json();

      if (res.ok) {
        window.location.href = "/luckydraw";
      } else {
        setError(result.message || "An error occurred, please try again");
        setLoading(false);
      }
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
                <Label htmlFor="workId">Corp Pass ID</Label>
                <Input
                  id="workId"
                  placeholder="eg: johndoe"
                  required
                  value={workId}
                  onChange={(e) => setWorkID(e.target.value)}
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
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner /> : submitText}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
