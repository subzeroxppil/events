import { GroupAssigner } from "@/components/GroupAssigner";

export default function Page() {
  return (
    <div className="flex w-full justify-center px-6 pt-6 pb-10 md:p-10">
      <div className="w-full max-w-sm">
        <GroupAssigner />
      </div>
    </div>
  );
}
