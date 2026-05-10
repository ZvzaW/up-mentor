"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton({ label }: { label: string }) {
  const router = useRouter();

  return (
    <div className="flex justify-center">
    <button 
      onClick={() => router.back()}
      className="bg-dirty-blue rounded-2xl p-3 pr-4 flex items-center text-sm gap-2 hover:bg-hover mb-5"
    >
      <ChevronLeft size={14} />
      {label}
    </button>
    </div>
  );
}