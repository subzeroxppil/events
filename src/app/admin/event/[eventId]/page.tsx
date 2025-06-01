"use client";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Info,
  LoaderPinwheel,
  PersonStanding,
  ReceiptText,
  SquarePen,
  Users,
  UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ghostAnimationData from "@/app/assets/ghost-animation.json";
import {
  GroupingStrategy,
  groupingStrategyMap,
  groupingStrategyTooltips,
} from "@/app/utils/common";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Lottie from "lottie-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const headers: Record<string, string> = {
  groupNumber: "Group Number",
  workId: "Corp Pass ID",
  registeredAt: "Registration Time",
  prizeName: "Prize",
};

type GroupCount = {
  groupNumber: number | null;
  count: number;
};

type EventStats = {
  totalAttendees: number;
  luckyDrawCompleted: number;
  unredeemedLuckyDraws: number;
  totalPrizesLeft: number;
};

type EventDetails = {
  name: string;
  createdBy: string;
  createdAt: string;
  location: string;
  country: string;
  eventStartTime: string;
  eventEndTime: string;
  groupingStrategy: GroupingStrategy | null;
  groupConfigNumber: number | null;
  hasLuckyDraw: boolean;
};

type DetailsData = {
  event: EventDetails;
  stats: EventStats;
  groupCounts: GroupCount[];
};

type UserData = {
  registeredAt: string;
  workId: string;
  groupNumber: number;
  prizeName: string | null;
  brandName: string | null;
};

export default function Page() {
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [detailsData, setDetailsData] = useState<DetailsData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("registeredAt");
  const params = useParams();
  const rawEventId = params?.eventId;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;
  const [initialLoading, setInitialLoading] = useState(true);
  const [usersDataLoading, setUsersDataLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!eventId) return;

    const loadInitialData = async () => {
      setInitialLoading(true);
      try {
        const [detailsJson, usersJson] = await Promise.all([
          fetchEventDetails(eventId),
          fetchEventUsers(eventId, sortBy),
        ]);
        setDetailsData(detailsJson);
        setUsersData(usersJson.users);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load data");
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, [eventId]);

  useEffect(() => {
    if (initialLoading || !eventId) return;

    const loadSortedUsers = async () => {
      setUsersDataLoading(true);
      try {
        const usersJson = await fetchEventUsers(eventId, sortBy);
        setUsersData(usersJson.users);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load sorted users");
      } finally {
        setUsersDataLoading(false);
      }
    };

    loadSortedUsers();
  }, [sortBy]);

  const fetchEventDetails = async (eventId: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events/${eventId}/details`
    );
    if (!res.ok) throw new Error("Failed to fetch event details");
    return res.json();
  };

  const fetchEventUsers = async (eventId: string, sortBy: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events/${eventId}/users?sortBy=${sortBy}`
    );
    if (!res.ok) throw new Error("Failed to fetch event users");
    return res.json();
  };

  const handleDeleteEvent = async () => {
    if (!eventId) return;

    try {
      setDeleteLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events/${eventId}/delete`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to delete event");

      router.push("/admin");
      toast("Event deleted 🗑️");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error deleting event");
    }
  };

  const handleExport = () => {
    const includeGroupNumber = !!detailsData?.event.groupingStrategy;
    const includePrize = !!detailsData?.event.hasLuckyDraw;

    const exportData = usersData.map((user) => {
      const row: Record<string, string | number> = {
        [headers.registeredAt]: user.registeredAt
          ? new Date(user.registeredAt).toLocaleString("en-SG", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "-",
        [headers.workId]: user.workId,
      };

      if (includeGroupNumber) {
        row[headers.groupNumber] = user.groupNumber;
      }

      if (includePrize) {
        row[headers.prizeName] =
          user.prizeName && user.brandName
            ? `${user.brandName} | ${user.prizeName}`
            : "-";
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees");

    XLSX.writeFile(workbook, `${detailsData?.event.name}_attendees.xlsx`);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 w-full max-w-[2000px] self-center">
          {initialLoading ? (
            <LoadingSpinner className="self-center mt-5" />
          ) : (
            <>
              <div className="px-4 lg:px-6 flex flex-col">
                <span className="text-4xl font-bold">
                  {detailsData?.event.name}
                </span>
                <div className="flex flex-col lg:flex-row justify-between lg:items-center mt-2 lg:mt-0">
                  <div className="flex items-center gap-1">
                    <SquarePen size={14} />
                    <span className="text-sm text-muted-foreground">
                      Created by {detailsData?.event.createdBy} on{" "}
                      {new Date(
                        detailsData?.event.createdAt || ""
                      ).toLocaleString("en-SG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Link href={`/admin/event/${eventId}/checkin`}>
                      <Button variant={"outline"}>QR code: Check In</Button>
                    </Link>
                    {detailsData?.event.hasLuckyDraw && (
                      <Link href={`/admin/event/${eventId}/luckydraw`}>
                        <Button variant="outline">QR code: Lucky Draw</Button>
                      </Link>
                    )}
                    <Button variant={"outline"}>Roulette game</Button>

                    <AlertDialog>
                      <AlertDialogTrigger>
                        <Button variant={"outline"}>Delete event</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete event?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your event and all data
                            related to it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          {/* <AlertDialogAction >Delete</AlertDialogAction> */}
                          <Button
                            variant="destructive"
                            onClick={handleDeleteEvent}
                            className="w-[75px]"
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? <LoadingSpinner /> : "Delete"}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-[#f8f8f8] *:data-[slot=card]:border-0 lg:px-6 xl:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
                <Card className="@container/card shadow-none">
                  <CardHeader>
                    <CardDescription className="text-lg flex items-center gap-1">
                      <ReceiptText size={20} />
                      Event Details
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {(() => {
                        const datetime = new Date(
                          detailsData?.event.eventStartTime || ""
                        );
                        const formatted = datetime.toLocaleString("en-SG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        });
                        const [date, time] = formatted.split(", ");
                        return (
                          <>
                            <span>{date},</span>
                            <br />
                            <span>{time}</span>
                          </>
                        );
                      })()}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      {detailsData?.event.country}
                    </div>
                    <div className="text-muted-foreground">
                      {detailsData?.event.location}
                    </div>
                  </CardFooter>
                </Card>
                <Card className="@container/card shadow-none">
                  <CardHeader>
                    <CardDescription className="text-lg flex items-center gap-1">
                      <PersonStanding size={20} />
                      Attendance
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {detailsData?.stats.totalAttendees}
                    </CardTitle>
                    <CardAction></CardAction>
                  </CardHeader>
                </Card>
                {detailsData?.event.hasLuckyDraw ? (
                  <Card className="@container/card shadow-none">
                    <>
                      <CardHeader>
                        <CardDescription className="text-lg flex items-center gap-1">
                          <LoaderPinwheel size={20} />
                          Lucky Draw Completions
                        </CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                          {detailsData?.stats.luckyDrawCompleted}
                        </CardTitle>
                        <CardAction></CardAction>
                      </CardHeader>
                      <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                          Prizes left: {detailsData?.stats.totalPrizesLeft}
                        </div>
                      </CardFooter>
                    </>
                  </Card>
                ) : (
                  <></>
                )}
                {detailsData?.event.groupingStrategy ? (
                  <Card className="@container/card shadow-none">
                    <>
                      <CardHeader>
                        <CardDescription className="text-lg flex items-center gap-1">
                          <UsersRound size={20} />
                          Groups Formed
                        </CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                          {detailsData?.groupCounts.length}
                        </CardTitle>
                        <CardAction></CardAction>
                      </CardHeader>
                      <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-1 font-medium">
                          Grouping Strategy:{" "}
                          {groupingStrategyMap[
                            detailsData?.event.groupingStrategy ?? ""
                          ] || "-"}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild className="">
                                <Info size={19} />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {detailsData?.event.groupingStrategy
                                    ? groupingStrategyTooltips[
                                        detailsData.event.groupingStrategy
                                      ]
                                    : ""}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardFooter>
                    </>
                  </Card>
                ) : (
                  <></>
                )}
              </div>
              <div className="px-4 lg:px-6">
                <Card className="flex-col flex w-full bg-[#f8f8f8] border-0 shadow-none min-h-80">
                  <div className="px-6">
                    <div className="flex gap-2 items-center">
                      <Users />
                      <span className="font-bold text-2xl">Overview</span>
                    </div>
                    {(detailsData?.stats?.totalAttendees ?? 0) > 0 ? (
                      <>
                        <div className="flex flex-col items-center text-center mt-4">
                          <div className="flex justify-between mb-2 w-full gap-2">
                            <Button variant="outline" onClick={handleExport}>
                              <Download />
                              Export
                            </Button>
                            <div className="flex items-center gap-2">
                              <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="bg-background">
                                  <SelectValue>
                                    {sortBy
                                      ? `Sort by ${headers[sortBy]}`
                                      : "Sort by"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="registeredAt">
                                    {headers.registeredAt}
                                  </SelectItem>
                                  <SelectItem value="workId">
                                    {headers.workId}
                                  </SelectItem>
                                  {detailsData?.event.groupingStrategy && (
                                    <SelectItem value="groupNumber">
                                      {headers.groupNumber}
                                    </SelectItem>
                                  )}
                                  {detailsData?.event.hasLuckyDraw && (
                                    <SelectItem value="prizeName">
                                      {headers.prizeName}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        {usersDataLoading ? (
                          <div className="flex justify-center py-6">
                            <LoadingSpinner />
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{headers.registeredAt}</TableHead>
                                <TableHead>{headers.workId}</TableHead>
                                {detailsData?.event.groupingStrategy && (
                                  <TableHead>{headers.groupNumber}</TableHead>
                                )}
                                {detailsData?.event.hasLuckyDraw && (
                                  <TableHead>{headers.prizeName}</TableHead>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {usersData.map((user) => (
                                <TableRow key={user.workId}>
                                  <TableCell className="font-medium">
                                    {user.registeredAt
                                      ? new Date(
                                          user.registeredAt
                                        ).toLocaleString("en-SG", {
                                          dateStyle: "medium",
                                          timeStyle: "short",
                                        })
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {user.workId}
                                  </TableCell>
                                  {detailsData?.event.groupingStrategy && (
                                    <TableCell>{user.groupNumber}</TableCell>
                                  )}
                                  {detailsData?.event.hasLuckyDraw && (
                                    <TableCell>
                                      {user.prizeName && user.brandName
                                        ? `${user.brandName} | ${user.prizeName}`
                                        : "-"}
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </>
                    ) : (
                      <>
                        {" "}
                        <div className="w-full py-30 flex flex-col items-center">
                          <Lottie
                            animationData={ghostAnimationData}
                            className="h-[170px]"
                          />
                          <span className="text-muted-foreground text-sm">
                            No attendees have checked in to this event yet
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
