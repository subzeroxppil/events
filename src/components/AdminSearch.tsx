import React from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search } from "lucide-react";

type AdminSearchProps = {
  query: string;
  setQuery: (value: string) => void;
  handleSearch: (query: string) => void;
};

function AdminSearch({ query, setQuery, handleSearch }: AdminSearchProps) {
  return (
    <div className="relative px-2 w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // handleSearch(query);
        }}
        className="relative group w-full"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-500 to-zinc-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 w-full" />

        <div className="relative flex items-center font-mono w-full">
          <Input
            placeholder="Search by Title/Country/Location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pr-10 sm:pr-12 md:pr-16 text-sm bg-background backdrop-blur-xs border-muted rounded-lg"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="absolute right-1.5 sm:right-2 h-7 w-7 sm:h-9 sm:w-9 md:h-10 md:w-10"
          >
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AdminSearch;
