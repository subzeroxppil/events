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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import BackButton from "@/components/BackButton";

import { PageTransition } from "@/components/PageTransition";
const headers: Record<string, string> = {
  groupNumber: "Group Number",
  workId: "Corp Pass ID",
  registeredAt: "Registration Time",
  prizeName: "Prize",
  businessUnit: "Business Unit",
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
  prizes: PrizeData[];
};

type UserData = {
  registeredAt: string;
  workId: string;
  groupNumber: number;
  prizeName: string | null;
  brandName: string | null;
};

type PrizeData = {
  name: string;
  quantity: number;
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
  const [businessUnitMap, setBusinessUnitMap] = useState<
    Record<string, string>
  >({});
  const [chartData, setChartData] = useState<
    { chartBusinessUnit: string; attendees: number; fill: string }[]
  >([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});

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

  const fetchBusinessUnitBreakdown = async (eventId: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events/${eventId}/businessUnitBreakdown`
    );
    if (!res.ok) return [];
    return res.json();
  };

  const fetchBusinessUnitMappings = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/businessUnit`
    );
    if (!res.ok) return;
    const data: { email: string; businessUnit: string }[] = await res.json();
    const map: Record<string, string> = {};
    for (const item of data) {
      map[item.email.split("@")[0].toLowerCase().trim()] = item.businessUnit;
    }
    setBusinessUnitMap(map);
  };

  const fetchEventUsers = async (eventId: string, sortBy: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events/${eventId}/users?sortBy=${sortBy}`
    );
    if (!res.ok) throw new Error("Failed to fetch event users");
    return res.json();
  };

  const fetchEventDetails = async (eventId: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events/${eventId}/details`
    );
    if (!res.ok) throw new Error("Failed to fetch event details");

    const data = await res.json();

    // hardcoded settings specific for impact day event
    if (data?.event?.name?.toLowerCase() === "impact day") {
      await fetchBusinessUnitMappings();
      const chartBreakdown = await fetchBusinessUnitBreakdown(eventId);
      setChartData(
        chartBreakdown.map((item: any, i: any) => ({
          chartBusinessUnit: item.businessUnit,
          attendees: item.count,
          fill: getColor(i),
        }))
      );

      const dynamicChartConfig: ChartConfig = {};

      for (const item of chartBreakdown) {
        dynamicChartConfig[item.businessUnit] = {
          label: item.businessUnit,
          color: "", // optional, if using `fill` in chartData instead
        };
      }

      dynamicChartConfig["attendees"] = {
        label: "attendees",
      };

      setChartConfig(dynamicChartConfig);
    }

    return data;
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
      toast.success("Event deleted");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error deleting event");
    }
  };

  const handleExport = () => {
    const includeGroupNumber = !!detailsData?.event.groupingStrategy;
    const includePrize = !!detailsData?.event.hasLuckyDraw;
    const includeBusinessUnit = Object.keys(businessUnitMap).length > 0;

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

      if (includeBusinessUnit) {
        row[headers.businessUnit] =
          businessUnitMap[user.workId.toLowerCase()] || "-";
      }

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

  // const chartData = [
  //   {
  //     chartBusinessUnit: "chrome",
  //     attendees: 275,
  //     fill: "var(--color-chrome)",
  //   },
  //   {
  //     chartBusinessUnit: "safari",
  //     attendees: 200,
  //     fill: "var(--color-safari)",
  //   },
  //   {
  //     chartBusinessUnit: "firefox",
  //     attendees: 187,
  //     fill: "var(--color-firefox)",
  //   },
  //   { chartBusinessUnit: "edge", attendees: 173, fill: "var(--color-edge)" },
  //   { chartBusinessUnit: "other", attendees: 90, fill: "var(--color-other)" },
  // ];

  const PIE_COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#a4de6c",
    "#d0ed57",
    "#8dd1e1",
    "#83a6ed",
    "#f56991",
    "#9b59b6",
    "#2ecc71",
    "#3498db",
    "#f1c40f",
    "#e67e22",
    "#1abc9c",
    "#e74c3c",
    "#34495e",
    "#7f8c8d",
    "#c0392b",
    "#16a085",
    "#2980b9",
    "#f39c12",
    "#27ae60",
    "#8e44ad",
    "#95a5a6",
  ];

  const getColor = (index: number) => PIE_COLORS[index % PIE_COLORS.length];

  const createdByCorpId =
    typeof detailsData?.event.createdBy === "string"
      ? detailsData?.event.createdBy.split("@")[0]
      : detailsData?.event.createdBy;

  return (
    <PageTransition className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-2 md:gap-6 w-full max-w-[2000px] self-center">
          {initialLoading ? (
            <LoadingSpinner className="self-center mt-5" />
          ) : (
            <>
              <div className="px-4 lg:px-6 flex flex-col">
                <BackButton className="self-start" />
                <span className="text-4xl font-bold">
                  {detailsData?.event.name}
                </span>
                <div className="flex flex-col lg:flex-row justify-between lg:items-center mt-2 lg:mt-0">
                  <div className="flex gap-1">
                    <SquarePen size={14} className="shrink-0 mt-[3px]" />
                    <span className="text-sm text-muted-foreground">
                      Created by {createdByCorpId} on{" "}
                      {new Date(
                        detailsData?.event.createdAt || ""
                      ).toLocaleString("en-SG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-2 flex-col md:flex-row">
                    <Link href={`/admin/event/${eventId}/checkin`}>
                      <Button variant={"outline"} className="w-full md:w-auto">
                        Check-in QR code
                      </Button>
                    </Link>
                    {detailsData?.event.hasLuckyDraw && (
                      <Link href={`/admin/event/${eventId}/luckydraw`}>
                        <Button variant="outline" className="w-full md:w-auto">
                          Spin & Win QR code
                        </Button>
                      </Link>
                    )}
                    {/* <Link href={`/admin/event/${eventId}/roulette`}>
                      <Button variant={"outline"} className="w-full md:w-auto">
                        Roulette game
                      </Button>
                    </Link> */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full md:w-auto"
                        >
                          Delete event
                        </Button>
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
                          <Button
                            variant="destructive"
                            onClick={handleDeleteEvent}
                            className="w-full sm:w-[75px]"
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
                    <CardTitle className="text-lg flex items-center gap-1 font-bold">
                      <ReceiptText size={20} />
                      Event Details
                    </CardTitle>
                    <CardDescription className="text-2xl tabular-nums @[250px]/card:text-3xl text-black-100">
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
                    </CardDescription>
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
                  {Object.keys(businessUnitMap).length > 0 &&
                  (detailsData?.stats?.totalAttendees ?? 0) ? (
                    <>
                      <CardHeader className="items-center pb-0">
                        <CardTitle className="text-lg flex items-center gap-1 font-bold">
                          <PersonStanding size={20} />
                          Attendance:
                          <span className="font-bold text-black">
                            {detailsData?.stats.totalAttendees}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 pb-0">
                        <ChartContainer
                          config={chartConfig}
                          className="mx-auto aspect-square max-h-[300px]"
                        >
                          <PieChart className="">
                            {/* <ChartTooltip
                              content={
                                <ChartTooltipContent nameKey="attendees" />
                              }

                            /> */}
                            <ChartTooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const { chartBusinessUnit, attendees, fill } =
                                    payload[0].payload;
                                  return (
                                    <div className="bg-white border rounded shadow text-sm flex gap-1 p-1">
                                      <div
                                        className="w-3 h-3 rounded-sm shrink-0 mt-[2px]"
                                        style={{ backgroundColor: fill }}
                                      ></div>
                                      <span className="text-muted-foreground text-xs">
                                        {chartBusinessUnit}: {attendees}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />

                            <Pie data={chartData} dataKey="attendees" />
                            {/* <ChartLegend
                              content={
                                <ChartLegendContent nameKey="chartBusinessUnit" />
                              }
                              className="flex flex-col gap-1 items-start"
                            /> */}
                          </PieChart>
                        </ChartContainer>
                        <div className="flex flex-col gap-1 mt-1">
                          {chartData.map((item, i) => (
                            <div key={i} className="flex gap-2 text-sm">
                              <div
                                className="w-3 h-3 rounded-sm shrink-0 mt-[2px]"
                                style={{ backgroundColor: item.fill }}
                              ></div>
                              <span className="text-muted-foreground text-xs">
                                {item.chartBusinessUnit} ({item.attendees})
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-1 font-bold">
                        <PersonStanding size={20} />
                        Attendance
                      </CardTitle>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {detailsData?.stats.totalAttendees}
                      </CardTitle>
                      <CardAction></CardAction>
                    </CardHeader>
                  )}
                </Card>
                {detailsData?.event.hasLuckyDraw ? (
                  <Card className="@container/card shadow-none">
                    <>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-1 font-bold">
                          <LoaderPinwheel size={20} />
                          Spin & Win Completions:
                          <span className="font-bold text-black">
                            {detailsData?.stats.luckyDrawCompleted}
                          </span>
                        </CardTitle>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Prize</TableHead>
                              <TableHead>Quantity Left</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detailsData?.prizes.map((prize) => (
                              <TableRow key={prize.name}>
                                <TableCell>{prize.name}</TableCell>
                                <TableCell>{prize.quantity}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardHeader>
                    </>
                  </Card>
                ) : (
                  <></>
                )}
                {detailsData?.event.groupingStrategy ? (
                  <Card className="@container/card shadow-none">
                    <>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-1 font-bold">
                          <UsersRound size={20} />
                          Groups Formed
                        </CardTitle>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                          {detailsData?.groupCounts.length}
                        </CardTitle>
                        <CardAction></CardAction>
                      </CardHeader>
                      <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-1 font-medium text-muted-foreground">
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
                                {Object.keys(businessUnitMap).length > 0 && (
                                  <TableHead>{headers.businessUnit}</TableHead>
                                )}
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
                                  {Object.keys(businessUnitMap).length > 0 && (
                                    <TableCell>
                                      {businessUnitMap[
                                        user.workId.toLowerCase()
                                      ] || "-"}
                                    </TableCell>
                                  )}
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
    </PageTransition>
  );
}
