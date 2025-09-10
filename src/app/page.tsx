// "use client";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import Image from "next/image";
// import { House, ShieldUser } from "lucide-react";
// import Link from "next/link";

// export default function Page() {
//   return (
//     <div className="flex w-full justify-center p-6 md:p-10 h-full">
//       <div className="w-full max-w-sm">
//         <div className="flex flex-col gap-4">
//           <Card className="mx-auto w-full max-w-sm p-6">
//             <div className="flex flex-col items-center text-center">
//               {/* <House size={40} /> */}
//               <Image
//                 src="/paypal_logo.png"
//                 width={70}
//                 height={35}
//                 alt="paypal icon"
//               />
//               <p className="mb-2 text-2xl font-bold">Events</p>
//               <div className="w-full flex flex-col gap-2 mt-4">
// <Link href="/admin">
//   <Button size={"lg"} className="w-full" variant="outline">
//     <ShieldUser />
//     <span>Admin Portal</span>
//   </Button>
// </Link>
//               </div>
//             </div>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EventCard } from "@/components/EventCard";
import { Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import Lottie from "lottie-react";
import searchAnimationData from "@/app/assets/search-cartoon-animation.json";
import { BlurFade } from "@/components/magicui/blur-fade";
import { DraggableCardDemo } from "@/components/DraggableCard";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { Features } from "@/components/Features";
import { NumberTickerDemo } from "@/components/NumberTicker";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [checkinsLoading, setCheckinsLoading] = useState(true);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [chartData, setChartData] = useState([]);
  const [chartConfig, setChartConfig] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);

  const PIE_COLORS = {
    Good: "#82ca9d",
    Neutral: "#ffc658",
    Bad: "#C4554D",
  };

  useEffect(() => {
    const fetchCheckins = async () => {
      try {
        setCheckinsLoading(true);
        const response = await fetch("/api/stats/checkins");
        if (response.ok) {
          const data = await response.json();
          setTotalCheckins(data.totalCheckins);
        } else {
          console.error("Failed to fetch check-ins");
        }
      } catch (error) {
        console.error("Error fetching check-ins:", error);
      } finally {
        setCheckinsLoading(false);
      }
    };

    fetchCheckins();
  }, []);

  return (
    <>
      <div className="w-full flex flex-col px-4 md:px-8 py-8 items-center self-center">
        {!loading ? (
          <LoadingSpinner className="my-10 self-center" />
        ) : errorMessage ? (
          <p className="text-red-500 text-sm text-center">{errorMessage}</p>
        ) : (
          <>
            <DraggableCardDemo />
            <div className="flex flex-col py-2 px-7 md:py-3 md:px-14 bg-[hsl(108,33%,90%)] rounded-lg mt-12 justify-center items-center w-full">
              {checkinsLoading ? (
                <>
                  <Skeleton className="h-16 md:h-20 w-32 md:w-40 bg-[#548164]/20" />
                  <span className="text-lg md:text-2xl font-semibold text-gray-700 mt-2">
                    Total check-ins 🥳
                  </span>
                </>
              ) : (
                <>
                  <NumberTicker
                    value={totalCheckins}
                    startValue={Math.max(0, totalCheckins - 100)}
                    className="whitespace-pre-wrap text-5xl md:text-7xl font-bold tracking-tighter text-[#548164]"
                  />
                  <span className="text-lg md:text-2xl font-semibold text-gray-700 mt-1">
                    Total check-ins 🥳
                  </span>
                </>
              )}
            </div>
            <div className="mx-auto mt-4 text-3xl font-bold tracking-tight md:text-5xl text-center">
              Manage events
              <PointerHighlight
                rectangleClassName="bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 leading-loose"
                pointerClassName="text-green-500 h-3 w-3"
                containerClassName="inline-block ml-1"
              >
                <span className="relative z-10">smartly</span>
              </PointerHighlight>
              .
            </div>
            <span className="text-sm md:text-lg text-muted-foreground mt-2 text-center">
              Psst... try dragging the cards around to see past events!
            </span>
            <Link href="/admin">
              <Button size={"lg"} className="w-full mt-4">
                <LogIn />
                <span>Let's get started</span>
              </Button>
            </Link>
            <Features />
          </>
        )}
      </div>
    </>
  );
}
