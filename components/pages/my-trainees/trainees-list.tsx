"use client";

import { useState } from "react";
import { Search, MapPin, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Trainee {
  key: string;
  slug: string;
  name: string;
  workplace: string;
}

interface TraineesListProps {
  initialTrainees: Trainee[];
}

export default function TraineesList({ initialTrainees }: TraineesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredTrainees = initialTrainees.filter((trainee) =>
    trainee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* SEARCH INPUT */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-sm">
          <Input
            type="text"
            placeholder="Wyszukaj"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-full pl-5 pr-10"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
        </div>
      </div>

      {/* LISTA PODOPIECZNYCH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTrainees.map((trainee) => (
          <Link
            key={trainee.key}
            href={`/dashboard/trainees/${trainee.slug}`}
            className="bg-dirty-blue hover:bg-hover group flex justify-between items-center rounded-xl p-5 text-left transition-all"
          >
            <div className="text-sm w-[95%]">
                <h2 className="text-lg text-gold truncate mb-5">{trainee.name}</h2>

                <div className="flex gap-2 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-baby-blue" />
                  <span className="truncate text-zinc-300 mt-0.5">{trainee.workplace}</span>
                </div>
            </div>
            <ChevronRight className="shrink-0 text-gray-300 group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}

        {filteredTrainees.length === 0 && searchQuery.length !== 0 &&(
          <p className="text-center text-gray-500 col-span-full py-10">
            Nie znaleziono podopiecznych.
          </p>
        )}

        {filteredTrainees.length === 0 && searchQuery.length === 0 &&(
          <p className="text-center text-gray-500 col-span-full py-10">
            Brak aktywnych współprac.
          </p>
        )}
      </div>
    </>
  );
}