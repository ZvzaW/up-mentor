"use client"

import { useState } from "react"
import { Search, MapPin, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Trainee {
  key: string
  slug: string
  name: string
  workplace: string
}

interface TraineesListProps {
  initialTrainees: Trainee[]
}

export default function TraineesList({ initialTrainees }: TraineesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const filteredTrainees = initialTrainees.filter((trainee) =>
    trainee.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* SEARCH INPUT */}
      <div className="mb-8 flex justify-center">
        <div className="relative w-full max-w-sm">
          <Input
            type="text"
            placeholder="Wyszukaj"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-full pr-10 pl-5"
          />
          <Search className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* LISTA PODOPIECZNYCH */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredTrainees.map((trainee) => (
          <Link
            key={trainee.key}
            href={`/dashboard/trainees/${trainee.slug}`}
            className="bg-dirty-blue hover:bg-hover group flex items-center justify-between rounded-xl p-5 text-left transition-all"
          >
            <div className="w-[95%] text-sm">
              <h2 className="text-gold mb-4 truncate text-lg">
                {trainee.name}
              </h2>

              <div className="flex gap-2 text-xs">
                <MapPin className="text-baby-blue h-3.5 w-3.5" />
                <span className="mt-0.5 truncate text-zinc-300">
                  {trainee.workplace}
                </span>
              </div>
            </div>
            <ChevronRight className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-1" />
          </Link>
        ))}

        {filteredTrainees.length === 0 && searchQuery.length !== 0 && (
          <p className="col-span-full py-10 text-center text-gray-500">
            Nie znaleziono podopiecznych.
          </p>
        )}

        {filteredTrainees.length === 0 && searchQuery.length === 0 && (
          <p className="col-span-full py-10 text-center text-gray-500">
            Brak aktywnych współprac.
          </p>
        )}
      </div>
    </>
  )
}
