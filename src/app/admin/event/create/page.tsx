"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  CalendarPlus,
  CircleAlert,
  CircleHelp,
  Info,
  LogIn,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/DateTimePicker";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { groupingStrategyTooltips } from "@/app/utils/common";
import BackButton from "@/components/BackButton";

export default function Page() {
  const [title, setTitle] = useState("");
  const [terms, setTerms] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [eventStartTime, setEventStartTime] = useState<Date | undefined>(
    undefined
  );
  const [eventEndTime, setEventEndTime] = useState<Date | undefined>(undefined);
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState("");
  const [groupConfigNumber, setGroupConfigNumber] = useState<
    number | undefined
  >(undefined);

  const [hasLuckyDraw, setHasLuckyDraw] = useState<boolean | undefined>(
    undefined
  );

  const [groupingStrategy, setGroupingStrategy] = useState<string>("");
  const [prizes, setPrizes] = useState([
    { brand: "", name: "", image: null as File | null, quantity: 1 },
  ]);

  const router = useRouter();

  const heading = "Create Event";
  const subheading =
    "Once the event is created, you'll be able to generate a QR code for attendees to scan upon arrival, enabling you to track attendance seamlessly.";

  const handlePrizeChange = (
    index: number,
    field: "brand" | "name" | "image" | "quantity",
    value: string | File | number | null
  ) => {
    const updated = [...prizes];

    if (field === "brand" || field === "name") {
      updated[index][field] = value as string;
    } else if (field === "image") {
      updated[index][field] = value as File | null;
    } else if (field === "quantity") {
      updated[index][field] = value as number;
    }

    setPrizes(updated);
  };

  const toUint8Array = (file: File): Promise<Uint8Array> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        resolve(new Uint8Array(arrayBuffer));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Input validation
    if (!title.trim() || !country.trim() || !location.trim()) {
      setError("Please fill in all fields.");
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

    if (title.trim().length > 60) {
      setError("Please use a shorter event name.");
      return;
    }

    if (
      groupingStrategy !== "noNeed" &&
      (!groupConfigNumber || groupConfigNumber <= 0)
    ) {
      setError("Please enter a valid number for group configuration.");
      return;
    }

    setLoading(true);
    try {
      let formattedPrizes: {
        brand: string;
        name: string;
        quantity: number;
        imageBlob: number[];
      }[] = [];

      if (hasLuckyDraw) {
        if (prizes.length <= 1) {
          setError("More than one prize is required for the lucky draw.");
          return;
        }

        formattedPrizes = [];

        for (const prize of prizes) {
          if (
            !prize.brand.trim() ||
            !prize.name.trim() ||
            !prize.image ||
            !prize.quantity ||
            prize.quantity <= 0
          ) {
            if (prize.name.trim().length > 18) {
              setError(
                `Prize Name "${prize.name.trim()}" is too long. (Max 18 characters, so that it will fit on the lucky draw wheel)`
              );
              return;
            }

            setError("Please fill in all fields for your lucky draw prizes.");
            return;
          }

          const imageBlob = await toUint8Array(prize.image);
          formattedPrizes.push({
            brand: prize.brand.trim(),
            name: prize.name.trim(),
            quantity: prize.quantity,
            imageBlob: Array.from(imageBlob),
          });
        }
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: title.trim(),
            country: country.trim(),
            location: location.trim(),
            eventStartTime,
            eventEndTime,
            hasLuckyDraw,
            groupingStrategy:
              groupingStrategy === "noNeed" ? null : groupingStrategy,
            groupConfigNumber:
              groupingStrategy === "noNeed" ? null : groupConfigNumber,
            prizes: formattedPrizes,
            terms: terms.trim() || null,
          }),
        }
      );

      const result = await res.json();

      if (res.ok) {
        router.push(`/admin`);
        toast.success("Event has been created");
      } else {
        setError(result.message || "An error occurred, please try again");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred, please try again");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex w-full justify-center p-6 md:p-10 h-full">
      <div className="flex flex-col gap-4 w-full max-w-xl">
        <BackButton className="self-start" />
        <Card className="w-full p-6">
          <div className="flex flex-col items-center text-center">
            <CalendarPlus size={50} />
            <p className="mb-2 text-2xl font-bold mt-1">{heading}</p>
            <p className="text-muted-foreground">{subheading}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <Label htmlFor="title">Name of Event</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild className="ml-1">
                        <Info size={19} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is the event name that attendees will see.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <Label htmlFor="terms">
                    Terms & Conditions of event (optional)
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild className="ml-1">
                        <Info size={19} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Attendees must accept these terms before they can
                          check in.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="terms"
                  placeholder="eg: By joining, you agree to the event's code of conduct..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label>
                  Do you need your attendees to be assigned into groups upon
                  arrival?
                </Label>
                <RadioGroup
                  value={groupingStrategy}
                  onValueChange={(value) => {
                    setGroupingStrategy(value);
                    setGroupConfigNumber(undefined);
                  }}
                >
                  <div className="flex items-center">
                    <RadioGroupItem value="maxGroupCapacity" id="r1" />
                    <Label htmlFor="r1" className="ml-2">
                      Yes, using max group capacity method
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild className="ml-1">
                          <Info size={19} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{groupingStrategyTooltips["maxGroupCapacity"]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {groupingStrategy === "maxGroupCapacity" && (
                    <div className="ml-6 mt-1">
                      <Input
                        type="number"
                        placeholder="Enter max people per group"
                        onChange={(e) =>
                          setGroupConfigNumber(parseInt(e.target.value, 10))
                        }
                        value={groupConfigNumber ?? ""}
                      />
                    </div>
                  )}

                  <div className="flex items-center">
                    <RadioGroupItem value="roundRobin" id="r2" />
                    <Label htmlFor="r2" className="ml-2">
                      Yes, using round robin method
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild className="ml-1">
                          <Info size={19} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{groupingStrategyTooltips["roundRobin"]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {groupingStrategy === "roundRobin" && (
                    <div className="ml-6 mt-1">
                      <Input
                        type="number"
                        placeholder="Enter number of groups"
                        onChange={(e) =>
                          setGroupConfigNumber(parseInt(e.target.value, 10))
                        }
                        value={groupConfigNumber}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="noNeed" id="r3" />
                    <Label htmlFor="r3">No need</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex">
                  <Label>Does your event require a Spin & Win?</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild className="ml-1">
                        <Info size={19} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Each attendee gets one spin to win a prize! After
                          checking in, they scan a QR code to spin a digital
                          wheel on their own device. As the admin, you can
                          pre-set the list of prizes, including quantity and
                          brand.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <RadioGroup
                  value={
                    hasLuckyDraw === undefined
                      ? ""
                      : hasLuckyDraw
                      ? "yes"
                      : "no"
                  }
                  onValueChange={(value) => {
                    if (value === "yes") {
                      setHasLuckyDraw(true);
                    } else if (value === "no") {
                      setHasLuckyDraw(false);
                      setPrizes([
                        { brand: "", name: "", image: null, quantity: 0 },
                      ]);
                    } else {
                      setHasLuckyDraw(undefined);
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="lucky-yes" />
                    <Label htmlFor="lucky-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="lucky-no" />
                    <Label htmlFor="lucky-no">No</Label>
                  </div>
                </RadioGroup>
                {hasLuckyDraw && (
                  <>
                    <Label className="mt-2 text-muted-foreground">
                      Please fill in your lucky draw prizes
                    </Label>
                    <div className="flex flex-col gap-4">
                      {prizes.map((prize, index) => (
                        <div
                          key={index}
                          className="flex flex-col gap-2 border p-3 rounded-md"
                        >
                          <Label>Brand of Prize</Label>
                          <Input
                            placeholder="eg: Apple"
                            value={prize.brand}
                            onChange={(e) =>
                              handlePrizeChange(index, "brand", e.target.value)
                            }
                          />
                          <Label className="mt-2">Prize Description</Label>
                          <Input
                            placeholder="eg: Airpods"
                            value={prize.name}
                            onChange={(e) =>
                              handlePrizeChange(index, "name", e.target.value)
                            }
                          />
                          <Label className="mt-2">Picture of Prize</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handlePrizeChange(
                                index,
                                "image",
                                e.target.files?.[0] || null
                              )
                            }
                          />
                          <Label className="mt-2">Quantity</Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="eg: 5"
                            value={prize.quantity}
                            onChange={(e) =>
                              handlePrizeChange(
                                index,
                                "quantity",
                                parseInt(e.target.value, 10) || 1
                              )
                            }
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-[150px]"
                        onClick={() =>
                          setPrizes([
                            ...prizes,
                            { brand: "", name: "", image: null, quantity: 0 },
                          ])
                        }
                      >
                        Add More Prizes
                      </Button>
                    </div>
                  </>
                )}
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
  );
}
