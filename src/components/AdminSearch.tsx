import React from "react";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminSearchProps = {
  query: string;
  setQuery: (value: string) => void;
};

function AdminSearch({ query, setQuery }: AdminSearchProps) {
  return (
    <div
      className={cn(
        "flex items-center border border-input rounded-md shadow-sm w-full bg-background max-w-2xl"
      )}
    >
      <SearchIcon className="h-[16px] w-[16px] ml-3 flex-shrink-0" />
      <input
        className={cn(
          "bg-background h-9 w-full rounded-md border-input px-3 py-1 transition-colors placeholder:text-muted-foreground focus-visible:outline-none  disabled:cursor-not-allowed disabled:opacity-50 text-base placeholder:text-sm"
        )}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by Event/Country/Location..."
      />
    </div>
  );
}

export default AdminSearch;
