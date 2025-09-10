import { getRelativeTime } from "@/app/utils/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Calendar, SquarePen } from "lucide-react";

interface LuckydrawCardProps {
  id: number;
  name: string;
  createdAt: Date;
  createdBy: string;
  eventCount: number;
}

export function LuckydrawCard({
  id,
  name,
  createdAt,
  createdBy,
  eventCount,
}: LuckydrawCardProps) {
  const createdByCorpId =
    typeof createdBy === "string" ? createdBy.split("@")[0] : createdBy;

  return (
    <Link href={`/admin/luckydraw/${id}`}>
      <Card className="fade-in hover:bg-slate-100 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{name}</CardTitle>
          <div className="flex flex-row items-center text-muted-foreground text-sm gap-x-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar size={14} className="shrink-0" />
              <span>
                {eventCount} event{eventCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <SquarePen size={14} className="shrink-0" />
              <span>
                Created {getRelativeTime(createdAt)} by {createdByCorpId}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default LuckydrawCard;
