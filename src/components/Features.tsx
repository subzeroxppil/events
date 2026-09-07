import { Card } from "@/components/ui/card";

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
            className="group flex flex-col overflow-hidden border-slate-200/80 bg-white p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#0463ce]/30 hover:shadow-lg"
          >
            {/* The panel leads the card and bleeds to its edges. Sitting it at
                the bottom with padding under it left a white strip below the
                tint, which read as the image failing to fill the card. */}
            <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-b from-[#eaf2ff] to-[#dbe8fb]">
              <img
                src={image}
                alt=""
                className="max-h-32 w-auto max-w-[70%] transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <div className="flex flex-1 flex-col gap-2 p-6">
              <h3 className="text-base font-semibold text-[#173066] md:text-lg">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
