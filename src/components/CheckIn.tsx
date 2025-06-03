"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "./ui/card";
import { LoadingSpinner } from "./LoadingSpinner";
import { CircleAlert, LogIn } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import onboardingAnimationData from "@/app/assets/handshake-animation.json";
import { Label } from "@/components/ui/label";
import { Checkbox } from "./ui/checkbox";
import { useMediaQuery } from "@/app/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
interface CheckInProps {
  className?: string;
}

const CheckIn = ({ className }: CheckInProps) => {
  const [workId, setWorkID] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [groupNumber, setGroupNumber] = useState(null);
  const params = useParams();
  const eventId = Array.isArray(params?.eventId)
    ? params?.eventId[0]
    : params?.eventId;

  const [eventName, setEventName] = useState("");
  const [terms, setTerms] = useState("");
  const [hasGrouping, setHasGrouping] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isTermsAgree, setIsTermsAgree] = useState(false);

  const submitText = "Check in";
  const resultSubheading = "We’re so glad to have you here 🎉";

  useEffect(() => {
    if (!eventId) return;

    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/events/${eventId}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError("Failed to load event info");
        return;
      }

      setEventName(data.name);
      setHasGrouping(data.groupingStrategy !== null);
      setTerms(data.terms ?? "");
    } catch (err) {
      setError("An error occurred while loading event info");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Input validation
    if (workId.trim().includes("@")) {
      setError("Please enter your Corp Pass ID before the '@'");
      return;
    }

    if (terms && !isTermsAgree) {
      setError("Please accept the terms and conditions to proceed");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId: workId.trim().toLowerCase(), eventId }),
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
      <Card className="mx-auto w-full max-w-sm p-6">
        {initialLoading ? (
          <LoadingSpinner className="self-center mt-5" />
        ) : (
          <>
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
                    Welcome!{" "}
                    {hasGrouping && (
                      <>
                        <br />
                        You’re in Group {groupNumber}
                      </>
                    )}
                  </>
                ) : (
                  eventName
                )}
              </p>
              <p className="text-muted-foreground">
                {showResult ? (
                  resultSubheading
                ) : hasGrouping ? (
                  <>👋 Welcome! Check in to join a group and get started.</>
                ) : (
                  <>👋 Welcome! Check in to get started.</>
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
                  {terms && (
                    <div className="flex items-center gap-3 mt-2">
                      <Checkbox
                        id="terms"
                        checked={isTermsAgree}
                        onCheckedChange={(checked) =>
                          setIsTermsAgree(!!checked)
                        }
                      />
                      <Label className="gap-0">
                        Accept{" "}
                        {isDesktop ? (
                          <Dialog
                            open={dialogOpen}
                            onOpenChange={setDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <span className="underline">
                                terms and conditions
                              </span>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Terms & Conditions</DialogTitle>
                                <DialogDescription>{terms}</DialogDescription>
                              </DialogHeader>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Drawer
                            open={dialogOpen}
                            onOpenChange={setDialogOpen}
                          >
                            <DrawerTrigger asChild>
                              <span className="underline">
                                terms and conditions
                              </span>
                            </DrawerTrigger>
                            <DrawerContent>
                              <DrawerHeader className="text-left">
                                <DrawerTitle>Terms & Conditions</DrawerTitle>
                                <DrawerDescription>{terms}</DrawerDescription>
                              </DrawerHeader>

                              <DrawerFooter className="pt-2">
                                <DrawerClose asChild>
                                  <Button variant="outline">Close</Button>
                                </DrawerClose>
                              </DrawerFooter>
                            </DrawerContent>
                          </Drawer>
                        )}
                      </Label>
                    </div>
                  )}
                  {error && (
                    <div className="flex mt-1 gap-1">
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
            ) : null}
          </>
        )}
      </Card>
    </section>
  );
};

export { CheckIn };
