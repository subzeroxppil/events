import { getRelativeTime } from "@/app/utils/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { CalendarDays } from "lucide-react";
import { SquarePen } from "lucide-react";

interface EventCardProps {
  id: number;
  title: string;
  country: string;
  location: string;
  attendees: number;
  eventStartTime: Date;
  createdAt: Date;
  createdBy: string;
}

export function EventCard({
  id,
  title,
  country,
  location,
  attendees,
  eventStartTime,
  createdAt,
  createdBy,
}: EventCardProps) {
  return (
    <Link
      href={{
        pathname: `/admin/event/${id}`,
      }}
    >
      <Card className="fade-in hover:bg-slate-100">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {country} | {location}
          </CardDescription>
          <div className="flex flex-row flex-start text-muted-foreground text-sm gap-x-3 items-center flex-wrap py-1">
            <div className="rounded-lg flex flex-row items-center gap-1">
              <Users size={14} className="shrink-0" />
              <div>{attendees}</div>
            </div>
            <div className="rounded-lg flex flex-row items-center gap-1">
              <CalendarDays size={14} className="shrink-0" />
              <div>
                {new Date(eventStartTime).toLocaleString("en-SG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </div>
            <div className="rounded-lg flex flex-row items-center gap-1">
              <SquarePen size={14} className="shrink-0" />
              <div>
                Created {getRelativeTime(createdAt)} by {createdBy}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
