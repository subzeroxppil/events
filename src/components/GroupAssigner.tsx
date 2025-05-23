"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "./ui/card";
import { LoadingSpinner } from "./LoadingSpinner";
import { CircleAlert } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import onboardingAnimationData from "@/app/assets/handshake-animation.json";
import { Label } from "@/components/ui/label";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
interface GroupAssignerProps {
  className?: string;
}

const GroupAssigner = ({ className }: GroupAssignerProps) => {
  const [workId, setWorkID] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [groupNumber, setGroupNumber] = useState(null);
  const router = useRouter();

  const heading = "Registration";
  const submitText = "Check in";

  const resultSubheading = "We’re so glad to have you here 🎉";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Input validation
    if (workId.trim().includes("@")) {
      setError("Please enter your Corp Pass ID before the '@'");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId: workId.trim() }),
      });

      const result = await res.json();

      if (res.ok) {
        setGroupNumber(result.groupNumber);
        setShowResult(true);
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
    <section className={`${className ?? ""} flex flex-col gap-4`}>
      {/* <div className="container">
        <div className="flex flex-col gap-4"> */}
      <Card className="mx-auto w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center">
          {showResult ? (
            <Lottie
              animationData={onboardingAnimationData}
              className="h-[170px]"
            />
          ) : (
            <Image
              src="/paypal_logo.png"
              width={60}
              height={60}
              alt="paypal icon"
            />
          )}
          <p className="mb-2 text-2xl font-bold">
            {showResult ? (
              <>
                Welcome to Impact Day! <br />
                You’re in Group {groupNumber}
              </>
            ) : (
              heading
            )}
          </p>
          <p className="text-muted-foreground">
            {showResult ? (
              resultSubheading
            ) : (
              <>
                👋 Welcome to Impact Day 2025! <br />
                Register now to join a group and get started.
              </>
            )}
          </p>
        </div>
        {!showResult ? (
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
        ) : null}
      </Card>
      {/* </div>
      </div> */}
    </section>
  );
};

export { GroupAssigner };
