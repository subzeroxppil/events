import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FeatureProps {
  title: string;
  description: string;
  image: string;
}

const features: FeatureProps[] = [
  {
    title: "No more manual attendance",
    description:
      "Let participants enter your venue by scanning your event QR code. Assign groups automatically on check-in if you need them.",
    image: "/qrfeature.png",
  },
  {
    title: "Attendance analytics",
    description:
      "See the demographics of who actually turned up, and use it to make the next event more inclusive and better attended.",
    image: "/analyticsfeature.png",
  },
  {
    title: "Engaging prize distribution",
    description:
      "Run a lucky draw the whole room can follow on their own phones, with merchant prizes and spin-to-wins.",
    image: "/luckydrawfeature.png",
  },
];

export const Features = () => {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-5xl scroll-mt-16 px-5 py-14 md:px-8 md:py-20"
    >
      <h2 className="text-center text-2xl font-bold tracking-tight text-[#173066] md:text-3xl">
        Everything an event day needs
      </h2>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ title, description, image }: FeatureProps) => (
          <Card
            key={title}
            className="flex flex-col overflow-hidden border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[#173066] md:text-lg">
                {title}
              </CardTitle>
            </CardHeader>

            <CardContent className="text-sm leading-relaxed text-slate-600">
              {description}
            </CardContent>

            {/* Pinned to the bottom of the card so the three images line up
                across the row even when the copy runs to different lengths. */}
            <div className="mt-auto flex items-end justify-center bg-[#f4f8ff] px-6 pt-6 pb-4">
              <img
                src={image}
                alt=""
                className="w-[180px] max-w-full lg:w-[220px]"
              />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
