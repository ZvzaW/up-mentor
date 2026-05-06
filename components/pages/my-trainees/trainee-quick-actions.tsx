"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Settings } from "lucide-react";
import { toast } from "sonner";

type TraineeQuickActionsProps = {
  traineeId: string;
  phone: string;
};

export function TraineeQuickActions({ traineeId, phone }: TraineeQuickActionsProps) {
  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      toast.success("Numer telefonu skopiowany.");
    } catch {
      toast.error("Nie udało się skopiować numeru telefonu.");
    }
  };

  const handleChatRedirect = () => {
    window.location.href = `/dashboard/chat?traineeId=${traineeId}`;
  };


  return (
    <div className="flex items-center justify-center gap-4">
      
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="border border-baby-blue rounded-full text-baby-blue"
        onClick={handleChatRedirect}
        title="Przejdź do czatu"
        aria-label="Przejdź do czatu"
      >
        <MessageCircle />
      </Button>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="border border-baby-blue rounded-full text-baby-blue"
        onClick={handleCopyPhone}
        title="Skopiuj numer telefonu"
        aria-label="Skopiuj numer telefonu"
      >
        <Phone />
      </Button>

      

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="border border-baby-blue rounded-full text-baby-blue"
        title="Zarządzaj współpracą"
        aria-label="Zarządzaj współpracą"
      >
        <Settings />
      </Button>
    </div>
  );
}
