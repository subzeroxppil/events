"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CalendarPlus, CircleAlert, LogIn } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/DateTimePicker";
import { toast } from "sonner";

export default function Page() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [eventStartTime, setEventStartTime] = useState<Date | undefined>(
    undefined
  );
  const [eventEndTime, setEventEndTime] = useState<Date | undefined>(undefined);
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState("");
  const [groupCount, setGroupCount] = useState(0);
  const [hasLuckyDraw, setHasLuckyDraw] = useState(false);
  const router = useRouter();

  const heading = "Create Event";
  const subheading =
    "Once the event is created, you'll be able to generate a QR code for attendees to scan upon arrival, enabling you to track attendance seamlessly.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Input validation
    if (!title.trim() || !country.trim() || !location.trim()) {
      setError("Please fill in all text fields.");
      return;
    }

    if (!eventStartTime || !eventEndTime) {
      setError("Please select both start and end date/time.");
      return;
    }

    if (eventEndTime <= eventStartTime) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events/createupdate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventTitle: title.trim(),
            groupCount,
            country: country.trim(),
            location: location.trim(),
            eventStartTime,
            eventEndTime,
            hasLuckyDraw,
            // id: 123, // optional, include if editing
          }),
        }
      );

      const result = await res.json();

      if (res.ok) {
        toast("Event has been created 🙌");
        router.push(`/admin`);
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
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="title">Name of Event</Label>
                  <Input
                    id="title"
                    placeholder="eg: Impact Day Wheelchair Building Session"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="eg: Singapore"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="eg: Suntec Convention Hall 4"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Start Date/TIme</Label>
                  <DateTimePicker
                    value={eventStartTime}
                    onChange={setEventStartTime}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>End Date/TIme</Label>
                  <DateTimePicker
                    value={eventEndTime}
                    onChange={setEventEndTime}
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
                  className="mt-2 w-full cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <CalendarPlus />
                      <span>Create Event</span>
                    </>
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
