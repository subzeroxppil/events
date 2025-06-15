import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search } from "lucide-react";

type AdminSearchProps = {
  query: string;
  setQuery: (value: string) => void;
};

function AdminSearch({ query, setQuery }: AdminSearchProps) {
  return (
    <div className="relative px-2 w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // handleSearch(query);
        }}
        className="relative group w-full"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r rounded-lg blur opacity-30 w-full" />

        <div className="relative flex items-center font-mono w-full">
          <Input
            placeholder="Search by Title/Country/Location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pr-10 sm:pr-12 md:pr-16 text-sm bg-background backdrop-blur-xs border-muted rounded-lg"
          />
          <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 absolute right-2.5" />
        </div>
      </form>
    </div>
  );
}

export default AdminSearch;
