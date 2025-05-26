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

type UserData = {
  workId: string;
  groupNumber: number;
  prizeName: string | null;
  brandName: string | null;
};

export default function Page() {
  const [data, setData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin`
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
  }, []);

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
    <div className="flex w-full justify-center px-6 pt-6 pb-10 md:p-10">
      <div className="flex flex-col gap-4 w-full max-w-xl">
        <Card className="mx-auto w-full p-6">
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

            <p className="mb-2 text-2xl font-bold">Admin Portal</p>
            {!loading && !errorMessage && (
              <p className="text-muted-foreground">
                Impact Day Attendees: {data.length}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center self-center">
              <LoadingSpinner />
            </div>
          ) : errorMessage ? (
            <p className="text-center text-red-500 font-medium mt-4">
              {errorMessage}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Corp Pass ID</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Prize</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((user) => (
                  <TableRow key={user.workId}>
                    <TableCell className="font-medium">{user.workId}</TableCell>
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
        </Card>
      </div>
    </div>
  );
}
