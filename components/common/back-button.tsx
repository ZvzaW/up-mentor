"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

export function BackButton({ label }: { label: string }) {
  const router = useRouter()

  return (
    <div className="flex justify-center">
      <button
        onClick={() => router.back()}
        className="bg-dirty-blue hover:bg-hover mb-5 flex items-center gap-2 rounded-2xl p-3 pr-4 text-sm"
      >
        <ChevronLeft size={14} />
        {label}
      </button>
    </div>
  )
}
