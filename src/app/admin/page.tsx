"use client";

import { GroupAssigner } from "@/components/GroupAssigner";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserData = {
  registeredAt: Date;
  workId: string;
  groupNumber: number;
  prizeName: string | null;
  brandName: string | null;
};

const sortLabels: Record<string, string> = {
  groupNumber: "Group Number",
  workId: "Corp Pass ID",
  registeredAt: "Registration Time",
  prizeName: "Prize Name",
};

export default function Page() {
  const [data, setData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("registeredAt");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) {
            router.push("/admin/login");
          }
        });
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin?sortBy=${sortBy}`
        );
        const result = await res.json();

        if (!res.ok) {
          // Backend error (e.g. 500)
          setErrorMessage(result.message || "Failed to fetch data");
          return;
        }

        setData(result.users);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sortBy]);

  function formatDateTime(input: string | Date): string {
    const date = typeof input === "string" ? new Date(input) : input;

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("en-SG", options);
  }

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      router.push("/admin/login");
      if (error) {
        setErrorMessage(error.message || "Failed to sign out");
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred during sign out.");
    }
  }

  return (
    <div className="flex w-full justify-center px-2 pt-6 pb-10 md:p-10">
      <div className="flex flex-col gap-4 w-full max-w-xl">
        <Card className="mx-auto w-full p-4 gap-0">
          <Button
            className="cursor-pointer w-[80px]"
            variant="outline"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
          <div className="flex flex-col items-center text-center">
            <Image
              src="/paypal_logo.png"
              width={60}
              height={60}
              alt="paypal icon"
            />
            <p className="text-2xl font-bold">Admin Portal</p>
          </div>
          {loading ? (
            <div className="flex flex-col items-center self-center mt-5">
              <LoadingSpinner />
            </div>
          ) : errorMessage ? (
            <p className="text-center text-red-500 font-medium mt-4">
              {errorMessage}
            </p>
          ) : (
            <>
              <div className="flex flex-col items-center text-center mt-2">
                <p className="text-muted-foreground">
                  Impact Day Attendees: {data.length}
                </p>
                <p className="text-muted-foreground">
                  Lucky Draw Completed:{" "}
                  {data.filter((user) => user.prizeName !== null).length}
                </p>
                <div className="flex justify-between mt-6 mb-2 w-full gap-2">
                  <Button variant="outline">Export</Button>
                  <div className="flex items-center gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue>
                          {sortBy ? `Sort by ${sortLabels[sortBy]}` : "Sort by"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="groupNumber">
                          Group Number
                        </SelectItem>
                        <SelectItem value="workId">Corp Pass ID</SelectItem>
                        <SelectItem value="registeredAt">
                          Registration Time
                        </SelectItem>
                        <SelectItem value="prizeName">Prize Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration Time</TableHead>
                    <TableHead>Corp Pass ID</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Prize</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((user) => (
                    <TableRow key={user.workId}>
                      <TableCell className="font-medium">
                        {formatDateTime(user.registeredAt)}
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
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
