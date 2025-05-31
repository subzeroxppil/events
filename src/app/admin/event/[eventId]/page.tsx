// "use client";
// import * as XLSX from "xlsx";
// import { Card } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import Image from "next/image";
// import { LoadingSpinner } from "@/components/LoadingSpinner";
// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { useParams, useRouter } from "next/navigation";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Download } from "lucide-react";
// import { createClient } from "@/lib/supabase/client";

// type UserData = {
//   registeredAt: string;
//   workId: string;
//   groupNumber: number;
//   prizeName: string | null;
//   brandName: string | null;
// };

// const headers: Record<string, string> = {
//   groupNumber: "Group Number",
//   workId: "Corp Pass ID",
//   registeredAt: "Registration Time",
//   prizeName: "Prize",
// };

// export default function Page() {
//   const [data, setData] = useState<UserData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const [sortBy, setSortBy] = useState("registeredAt");
//   const router = useRouter();
//   const supabase = createClient();
//   const params = useParams();
//   const eventId = params?.id;

//   useEffect(() => {
//     fetchEventData();
//   }, [eventId, sortBy]);

//   const fetchEventData = async () => {
//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/event/${eventId}?sortBy=${sortBy}`
//       );
//       const result = await res.json();

//       if (!res.ok) {
//         setErrorMessage(result.message || "Failed to fetch data");
//         return;
//       }

//       setData(result.users);
//     } catch (err: any) {
//       setErrorMessage(err.message || "Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleExport = () => {
//     const exportData = data.map((user) => ({
//       [headers.registeredAt]: user.registeredAt,
//       [headers.workId]: user.workId,
//       [headers.groupNumber]: user.groupNumber,
//       [headers.prizeName]:
//         user.prizeName && user.brandName
//           ? `${user.brandName} | ${user.prizeName}`
//           : "-", // Combine prize name and brand name or show "-" if not available
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(exportData); // `data` is your JSON array
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees");

//     XLSX.writeFile(workbook, "impact_day_2025_attendees.xlsx");
//   };

//   return (
//     <div className="flex w-full justify-center px-2 pt-6 pb-10 md:p-10">
//       <div className="flex flex-col gap-4 w-full max-w-xl">
//         <Card className="mx-auto w-full p-4 gap-0">
//           <div className="flex flex-col items-center text-center">
//             <Image
//               src="/paypal_logo.png"
//               width={60}
//               height={60}
//               alt="paypal icon"
//             />
//             <p className="text-2xl font-bold">Admin Portal</p>
//           </div>
//           {loading ? (
//             <div className="flex flex-col items-center self-center mt-5">
//               <LoadingSpinner />
//             </div>
//           ) : errorMessage ? (
//             <p className="text-center text-red-500 font-medium mt-4">
//               {errorMessage}
//             </p>
//           ) : (
// <>
//   <div className="flex flex-col items-center text-center mt-2">
//     <p className="text-muted-foreground">
//       Impact Day Attendees: {data.length}
//     </p>
//     <p className="text-muted-foreground">
//       Lucky Draw Completed:{" "}
//       {data.filter((user) => user.prizeName !== null).length}
//     </p>
//     <div className="flex justify-between mt-6 mb-2 w-full gap-2">
//       <Button variant="outline" onClick={handleExport}>
//         <Download />
//         Export
//       </Button>
//       <div className="flex items-center gap-2">
//         <Select value={sortBy} onValueChange={setSortBy}>
//           <SelectTrigger>
//             <SelectValue>
//               {sortBy ? `Sort by ${headers[sortBy]}` : "Sort by"}
//             </SelectValue>
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="registeredAt">
//               {headers.registeredAt}
//             </SelectItem>
//             <SelectItem value="groupNumber">
//               {headers.groupNumber}
//             </SelectItem>
//             <SelectItem value="workId">{headers.workId}</SelectItem>
//             <SelectItem value="prizeName">
//               {headers.prizeName}
//             </SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//     </div>
//   </div>
//   <Table>
//     <TableHeader>
//       <TableRow>
//         <TableHead>{headers.registeredAt}</TableHead>
//         <TableHead>{headers.workId}</TableHead>
//         <TableHead>{headers.groupNumber}</TableHead>
//         <TableHead>{headers.prizeName}</TableHead>
//       </TableRow>
//     </TableHeader>
//     <TableBody>
//       {data.map((user) => (
//         <TableRow key={user.workId}>
//           <TableCell className="font-medium">
//             {user.registeredAt}
//           </TableCell>
//           <TableCell className="font-medium">
//             {user.workId}
//           </TableCell>
//           <TableCell>{user.groupNumber}</TableCell>
//           <TableCell>
//             {user.prizeName && user.brandName
//               ? `${user.brandName} | ${user.prizeName}`
//               : "-"}
//           </TableCell>
//         </TableRow>
//       ))}
//     </TableBody>
//   </Table>
// </>
//           )}
//         </Card>
//       </div>
//     </div>
//   );
// }

// "use client";
// import * as XLSX from "xlsx";
// import { Card } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import Image from "next/image";
// import { LoadingSpinner } from "@/components/LoadingSpinner";
// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { useParams, useRouter } from "next/navigation";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Download } from "lucide-react";
// import { createClient } from "@/lib/supabase/client";

// type UserData = {
//   registeredAt: string;
//   workId: string;
//   groupNumber: number;
//   prizeName: string | null;
//   brandName: string | null;
// };

// const headers: Record<string, string> = {
//   groupNumber: "Group Number",
//   workId: "Corp Pass ID",
//   registeredAt: "Registration Time",
//   prizeName: "Prize",
// };

// export default function Page() {
// const [data, setData] = useState<UserData[]>([]);
// const [loading, setLoading] = useState(true);
// const [errorMessage, setErrorMessage] = useState<string | null>(null);
// const [sortBy, setSortBy] = useState("registeredAt");
// const router = useRouter();
// const supabase = createClient();
// const params = useParams();
// const eventId = params?.id;

//   useEffect(() => {
//     // fetchEventData();
//   }, [eventId, sortBy]);

//   const fetchEventData = async () => {
//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/event/${eventId}?sortBy=${sortBy}`
//       );
//       const result = await res.json();

//       if (!res.ok) {
//         setErrorMessage(result.message || "Failed to fetch data");
//         return;
//       }

//       setData(result.users);
//     } catch (err: any) {
//       setErrorMessage(err.message || "Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   };
// const handleExport = () => {
//   const exportData = data.map((user) => ({
//     [headers.registeredAt]: user.registeredAt,
//     [headers.workId]: user.workId,
//     [headers.groupNumber]: user.groupNumber,
//     [headers.prizeName]:
//       user.prizeName && user.brandName
//         ? `${user.brandName} | ${user.prizeName}`
//         : "-", // Combine prize name and brand name or show "-" if not available
//   }));

//   const worksheet = XLSX.utils.json_to_sheet(exportData); // `data` is your JSON array
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees");

//   XLSX.writeFile(workbook, "impact_day_2025_attendees.xlsx");
// };

//   return (
//     <div className="flex w-full flex-col items-center px-6 pt-6 pb-10 gap-4">
//       <div className="flex flex-col w-full max-w-4xl bg-slate-200">
//         <span className="font-bold text-3xl">Impact Day</span>
//         <div className="flex w-full flex-col gap-2 mt-4">
//           <div className="flex w-full justify-between">
//             <Card className=" p-4 flex flex-col">event organiser details</Card>
//             <Card className=" p-4 flex flex-col">attendance count</Card>
//             <Card className=" p-4 flex flex-col">group details</Card>
//             <Card className=" p-4 flex flex-col">lucky draw details</Card>
//           </div>
//           <Card className=" p-4 flex flex-col">attendance</Card>
//         </div>
//       </div>
//     </div>
//   );
// }

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
import Image from "next/image";
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
  LoaderPinwheel,
  PersonStanding,
  ReceiptText,
  Users,
  UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ghostAnimationData from "@/app/assets/ghost-animation.json";

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
  groupingStrategy: "roundRobin" | "maxGroupCapacity" | null;
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
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("registeredAt");
  const router = useRouter();
  const supabase = createClient();
  const params = useParams();
  const rawEventId = params?.eventId;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;
  const [initialLoading, setInitialLoading] = useState(true); // full page
  const [usersDataLoading, setUsersDataLoading] = useState(false); // sort re-fetch

  const strategyMap: Record<string, string> = {
    roundRobin: "Round Robin",
    maxGroupCapacity: "Max Group Capacity",
  };

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

  const handleExport = () => {
    const exportData = usersData.map((user) => ({
      [headers.registeredAt]: user.registeredAt,
      [headers.workId]: user.workId,
      [headers.groupNumber]: user.groupNumber,
      [headers.prizeName]:
        user.prizeName && user.brandName
          ? `${user.brandName} | ${user.prizeName}`
          : "-", // Combine prize name and brand name or show "-" if not available
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData); // `data` is your JSON array
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees");

    XLSX.writeFile(workbook, "impact_day_2025_attendees.xlsx");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {initialLoading ? (
            <LoadingSpinner className="self-center mt-5" />
          ) : (
            <>
              <div className="px-4 lg:px-6 flex flex-col">
                <span className="text-4xl font-bold">
                  {detailsData?.event.name}
                </span>
                <span className="text-sm text-muted-foreground mt-2 ">
                  Created by {detailsData?.event.createdBy} on{" "}
                  {new Date(detailsData?.event.createdAt || "").toLocaleString(
                    "en-SG",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-[#f8f8f8] *:data-[slot=card]:border-0 lg:px-6 xl:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
                {/* <div className="grid gap-4 px-4 lg:px-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]"> */}
                <Card className="@container/card">
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
                <Card className="@container/card">
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
                  <Card className="@container/card">
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
                          Unredeemed lucky draws:{" "}
                          {detailsData?.stats.unredeemedLuckyDraws}
                        </div>
                        <div className="text-muted-foreground">
                          Prizes left: {detailsData?.stats.totalPrizesLeft}
                        </div>
                      </CardFooter>
                    </>
                  </Card>
                ) : (
                  <></>
                )}
                {detailsData?.event.groupingStrategy ? (
                  <Card className="@container/card">
                    <>
                      <CardHeader>
                        <CardDescription className="text-lg flex items-center gap-1">
                          <UsersRound size={20} />
                          Groups formed
                        </CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                          {detailsData?.groupCounts.length}
                        </CardTitle>
                        <CardAction></CardAction>
                      </CardHeader>
                      <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="line-clamp-1 flex gap-2 font-medium">
                          Grouping Strategy:{" "}
                          {strategyMap[
                            detailsData?.event.groupingStrategy ?? ""
                          ] || "-"}
                        </div>
                      </CardFooter>
                    </>
                  </Card>
                ) : (
                  <></>
                )}
              </div>
              <div className="px-4 lg:px-6">
                <Card className="flex-col flex w-full bg-[#f8f8f8] border-0">
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
                                <SelectTrigger>
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
                                  <SelectItem value="groupNumber">
                                    {headers.groupNumber}
                                  </SelectItem>
                                  <SelectItem value="workId">
                                    {headers.workId}
                                  </SelectItem>
                                  <SelectItem value="prizeName">
                                    {headers.prizeName}
                                  </SelectItem>
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
                                <TableHead>{headers.groupNumber}</TableHead>
                                <TableHead>{headers.prizeName}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {usersData.map((user) => (
                                <TableRow key={user.workId}>
                                  <TableCell className="font-medium">
                                    {user.registeredAt}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {user.workId}
                                  </TableCell>
                                  <TableCell>{user.groupNumber}</TableCell>
                                  <TableCell>
                                    {user.prizeName && user.brandName
                                      ? `${user.brandName} | ${user.prizeName}`
                                      : "-"}
                                  </TableCell>
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
