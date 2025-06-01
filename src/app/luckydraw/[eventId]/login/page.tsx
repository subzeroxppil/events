"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CircleAlert, LogIn } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

export default function Page() {
  const [workId, setWorkID] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [eventName, setEventName] = useState("");

  const router = useRouter();

  const heading = "Lucky Draw";
  const submitText = "Login";
  const params = useParams();
  const eventId = Array.isArray(params?.eventId)
    ? params.eventId[0]
    : params?.eventId;

  useEffect(() => {
    if (!eventId) {
      setError("Missing event ID in the URL.");
      setInitialLoading(false);
      return;
    }

    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/events/${eventId}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError("Failed to fetch event info");
      }

      if (!data.hasLuckyDraw) {
        setError("Lucky Draw not enabled for this event.");
      }

      setEventName(data.name);
    } catch (err) {
      setError("Unable to load event info. Please check the link.");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    // Input validation
    if (workId.trim().includes("@")) {
      setLoginError("Please enter your Corp Pass ID before the '@'");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/luckydraw/${eventId}/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workId: workId.trim() }),
        }
      );

      const result = await res.json();

      if (res.ok) {
        window.location.href = `/luckydraw/${eventId}`;
      } else {
        setLoginError(result.message || "An error occurred, please try again");
        setLoading(false);
      }
    } catch (error) {
      setLoginError("An error occurred, please try again");
      setLoading(false);
    }
  };
  return (
    <div className="flex w-full justify-center p-6 md:p-10 h-full">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-4">
          {error ? (
            <span className="text-sm text-red-500 self-center">{error}</span>
          ) : initialLoading ? (
            <LoadingSpinner className="self-center" />
          ) : (
            <Card className="mx-auto w-full max-w-sm p-6">
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/paypal_logo.png"
                  width={60}
                  height={60}
                  alt="paypal icon"
                />
                <p className="mb-2 text-2xl font-bold">{heading}</p>
                <p className="text-muted-foreground">
                  {`Thank you for spending your time at ${eventName} — enjoy a
                free gift as our token of appreciation! 🎁`}
                </p>
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
                  {loginError && (
                    <div className="flex items-center gap-1">
                      <div>
                        <CircleAlert size="20px" color="#ef4444" />
                      </div>
                      <span className="text-sm text-red-500">{loginError}</span>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="mt-2 w-full cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <LogIn />
                        <span>{submitText}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
