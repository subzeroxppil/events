import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
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
      "Let participants easily enter your venue by scanning your event QR code. No more manual check-ins required.",
    image: "/qrfeature.png",
  },
  {
    title: "Attendance analytics",
    description:
      "Discover the demographics of your event's attendees. Enhance inclusivity and engagement for future events.",
    image: "/analyticsfeature.png",
  },
  {
    title: "Gamified prize distribution",
    description:
      "Partner merchants to distribute prizes via in-app lucky-draw and spin-to-wins.",
    image: "/luckydrawfeature.png",
  },
];

// const featureList: string[] = [
//   "QR code generation",
//   "Lucky Draw",
//   "Spin to Win",
//   "Pricing",
//   "Contact form",
//   "Our team",
//   "Responsive design",
//   "Newsletter",
//   "Minimalist",
// ];

export const Features = () => {
  return (
    <section id="features" className="container py-12 space-y-8">
      {/* <h2 className="text-3xl lg:text-4xl font-bold md:text-center">
        We make it <span className="text-primary">Effortless</span> for you
      </h2> */}
      {/* 
      <div className="flex flex-wrap md:justify-center gap-4">
        {featureList.map((feature: string) => (
          <div key={feature}>
            <Badge variant="secondary" className="text-sm">
              {feature}
            </Badge>
          </div>
        ))}
      </div> */}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map(({ title, description, image }: FeatureProps) => (
          <Card key={title} className="border-0 bg-[#f8f8f8] shadow-none">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>

            <CardContent>{description}</CardContent>

            <CardFooter>
              <img
                src={image}
                alt="About feature"
                className="w-[200px] lg:w-[300px] mx-auto"
              />
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};
