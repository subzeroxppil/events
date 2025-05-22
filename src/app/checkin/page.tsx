import { GroupAssigner } from "@/components/GroupAssigner";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <GroupAssigner />
      </div>
    </div>
  );
}
