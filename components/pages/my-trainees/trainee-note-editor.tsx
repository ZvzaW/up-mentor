"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Cloud, CloudAlert, CloudCheck, CloudCog } from "lucide-react";
import { updateMyTraineeNote } from "@/actions/my-trainees";

type SaveStatus = "idle" | "typing" | "saving" | "saved" | "error";

type TraineeNoteEditorProps = {
  traineeId: string;
  initialNote: string;
};

const DEBOUNCE_MS = 2000;

export function TraineeNoteEditor({ traineeId, initialNote }: TraineeNoteEditorProps) {
  const [note, setNote] = useState(initialNote);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const lastSavedNoteRef = useRef(initialNote);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (note === lastSavedNoteRef.current) {
      return;
    }

    const timeout = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setStatus("saving");

      const result = await updateMyTraineeNote(traineeId, note);
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (result?.error) {
        setStatus("error");
        return;
      }

      lastSavedNoteRef.current = note;
      setStatus("saved");
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [note, traineeId]);

  const statusInfo = {
    idle: {
      text: "Notatka gotowa do edycji",
      icon: <Cloud className="w-4 h-4 text-zinc-400" />,
      textClassName: "text-zinc-400",
    },
    typing: {
      text: "Edytujesz - zapis za chwilę",
      icon: <CloudCog className="w-4 h-4 text-baby-blue" />,
      textClassName: "text-baby-blue",
    },
    saving: {
      text: "Zapisywanie...",
      icon: <CloudCog className="w-4 h-4 text-baby-blue animate-pulse" />,
      textClassName: "text-baby-blue",
    },
    saved: {
      text: "Zapisano",
      icon: <CloudCheck className="w-4 h-4 text-emerald-400" />,
      textClassName: "text-emerald-400",
    },
    error: {
      text: "Błąd zapisu - spróbuj ponownie",
      icon: <CloudAlert className="w-4 h-4 text-red-400" />,
      textClassName: "text-red-400",
    },
  } satisfies Record<
    SaveStatus,
    { text: string; icon: ReactNode; textClassName: string }
  >;

  const currentStatus = statusInfo[status];

  return (
    <div>
      <div className="p-2  bg-dirty-blue/40 rounded-md focus-within:ring-1 focus-within:ring-baby-blue">
        <textarea
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          setStatus("typing");
        }}
        className="custom-scrollbar w-full h-35 resize-none p-1 text-sm outline-none "
        placeholder="Dodaj notatkę dotyczącą współpracy z podopiecznym lub inne ważne informacje..."
      />
      </div>
      

      <p className={`mt-3 text-xs flex items-center gap-2 ${currentStatus.textClassName}`}>
        {currentStatus.icon}
        {currentStatus.text}
      </p>
    </div>
  );
}
