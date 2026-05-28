"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, Phone, Settings, Share2 } from "lucide-react"
import { toast } from "sonner"
import { FinishCooperationDialog } from "@/components/dialogs/finish-cooperation"

type TrainerQuickActionsProps = {
  trainerId: string
  phone: string
  slug: string
}

export function TrainerQuickActions({
  trainerId,
  phone,
  slug,
}: TrainerQuickActionsProps) {
  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(phone)
      toast.success("Numer telefonu skopiowany.")
    } catch {
      toast.error("Nie udało się skopiować numeru telefonu.")
    }
  }

  const handleCopyProfileLink = async () => {
    try {
      const profileLink = `${window.location.origin}/dashboard/trainers/catalog/${slug}`
      await navigator.clipboard.writeText(profileLink)
      toast.success("Link do profilu trenera skopiowany.")
    } catch {
      toast.error("Nie udało się skopiować linku.")
    }
  }

  const handleChatRedirect = () => {
    window.location.href = `/dashboard/chat?trainer=${trainerId}`
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="border-baby-blue text-baby-blue rounded-full border"
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
        className="border-baby-blue text-baby-blue rounded-full border"
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
        className="border-baby-blue text-baby-blue rounded-full border"
        onClick={handleCopyProfileLink}
        title="Skopiuj link do profilu"
        aria-label="Skopiuj link do profilu w katalogu"
      >
        <Share2 />
      </Button>

      <FinishCooperationDialog partnerId={trainerId}>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="border-baby-blue text-baby-blue rounded-full border"
          title="Zarządzaj współpracą"
          aria-label="Zarządzaj współpracą"
        >
          <Settings />
        </Button>
      </FinishCooperationDialog>
    </div>
  )
}
