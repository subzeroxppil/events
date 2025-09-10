"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className={cn("mb-2 w-[40px] h-[30px]", className)}
      onClick={() => router.back()}
    >
      <ArrowLeft />
    </Button>
  );
}

export default BackButton;
