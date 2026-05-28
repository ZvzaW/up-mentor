"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import Pusher from "pusher-js"
import { format, isToday } from "date-fns"
import { pl } from "date-fns/locale"
import { ArrowLeft, Send } from "lucide-react"
import { toast } from "sonner"
import { getChatMessages, sendChatMessage } from "@/actions/chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getCooperationChannelName } from "@/lib/chat-channel"
import {
  ChatConversationDTO,
  ChatMessageDTO,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

type ChatViewProps = {
  conversations: ChatConversationDTO[]
  currentUserId: string
  initialTrainerId?: string
  initialTraineeId?: string
  pusherKey: string
  pusherCluster: string
}

function formatMessageTime(createdAt: string | Date) {
  const date = new Date(createdAt)
  return isToday(date)
    ? format(date, "HH:mm", { locale: pl })
    : format(date, "d MMMM yyyy, HH:mm", { locale: pl })
}

function resolveInitialConversation(
  conversations: ChatConversationDTO[],
  initialTrainerId?: string,
  initialTraineeId?: string
): ChatConversationDTO | null {
  if (!initialTrainerId || !initialTraineeId) {
    return conversations[0] ?? null
  }

  return (
    conversations.find(
      (conversation) =>
        conversation.trainerId === initialTrainerId &&
        conversation.traineeId === initialTraineeId
    ) ?? null
  )
}

export function ChatView({
  conversations,
  currentUserId,
  initialTrainerId,
  initialTraineeId,
  pusherKey,
  pusherCluster,
}: ChatViewProps) {
  const [selected, setSelected] = useState<ChatConversationDTO | null>(() =>
    resolveInitialConversation(
      conversations,
      initialTrainerId,
      initialTraineeId
    )
  )
  const [messages, setMessages] = useState<ChatMessageDTO[]>([])
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const channelName = useMemo(() => {
    if (!selected) return null
    return getCooperationChannelName(selected.trainerId, selected.traineeId)
  }, [selected])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const loadMessages = useCallback(
    async (trainerId: string, traineeId: string) => {
      setIsLoadingMessages(true)
      setMessagesError(null)
      const result = await getChatMessages(trainerId, traineeId)
      setIsLoadingMessages(false)

      if (result.error) {
        setMessagesError(result.error)
        setMessages([])
        return
      }

      if (result.data) {
        setMessages(result.data)
      }
    },
    []
  )

  useEffect(() => {
    if (!selected) {
      setMessages([])
      setMessagesError(null)
      return
    }

    void loadMessages(selected.trainerId, selected.traineeId)
  }, [selected, loadMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!selected || !channelName || !pusherKey || !pusherCluster) return

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: "/api/pusher/auth",
    })

    const channel = pusher.subscribe(channelName)

    const handleNewMessage = (payload: ChatMessageDTO) => {
      setMessages((current) => {
        if (current.some((message) => message.id === payload.id)) {
          return current
        }

        return [
          ...current,
          {
            ...payload,
            isOwn: payload.senderId === currentUserId,
          },
        ]
      })
    }

    channel.bind("new-message", handleNewMessage)

    return () => {
      channel.unbind("new-message", handleNewMessage)
      pusher.unsubscribe(channelName)
      pusher.disconnect()
    }
  }, [selected, channelName, pusherKey, pusherCluster, currentUserId])

  
  const handleSend = () => {
    if (!selected) return

    const content = draft.trim()
    if (!content) return

    startTransition(async () => {
      const result = await sendChatMessage(
        selected.trainerId,
        selected.traineeId,
        content
      )

      if (result.error) {
        toast.error(result.error)
        return
      } else if (result.data) {
        const newMessage = result.data
        setMessages((current) => {
          if (current.some((message) => message.id === newMessage.id)) {
            return current
          }
          return [...current, newMessage]
        })
      } 

      setDraft("")
    })
  }

  if (conversations.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-white/10 bg-zinc-900/40 p-6 text-center mt-10">
        Nie masz aktywnych współprac — czat będzie dostępny po nawiązaniu
        współpracy z trenerem lub podopiecznym.
      </p>
    )
  }

  return (
    <div className="flex flex-row gap-4 min-h-0 w-full h-full">

      {/* Lista czatów */}
      <Card
        className={cn(
          "shadow-none flex min-h-0 flex-col gap-2 overflow-y-auto custom-scrollbar p-3 h-full w-full sm:w-[40%]",
          selected ? "hidden md:flex" : "flex"
        )}
      >
        <p className="mb-2 mx-auto font-michroma py-1">Twoje czaty</p>
        {conversations.map((conversation) => {
          const isActive =
            selected?.trainerId === conversation.trainerId &&
            selected?.traineeId === conversation.traineeId

          return (
            <button
              key={`${conversation.trainerId}-${conversation.traineeId}`}
              type="button"
              onClick={() => setSelected(conversation)}
              className={cn(
                "rounded-lg p-3 text-left transition-colors bg-dirty-blue/60",
                isActive
                  ? "bg-hover text-gold"
                  : "hover:bg-hover"
              )}
            >
              <p className="truncate">{conversation.partnerName}</p>

            </button>
          )
        })}
      </Card>

   {/*Dany czat*/}
      <Card
        className={cn(
          "flex h-full min-h-0 flex-col rounded-xl py-0 shadow-none w-full",
          selected ? "flex" : "hidden md:flex"
        )}
      >
        {selected ? (
          <>
              <div className="flex items-center gap-3 border-b border-white/40 pt-3 px-3 pb-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="md:hidden text-gold"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-gold text-lg flex-1">
                  {selected.partnerName}
                </h2>
              </div>

            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar px-4">
              {isLoadingMessages && (
                <p className="text-center text-sm text-zinc-400">
                  Ładowanie wiadomości…
                </p>
              )}

              {!isLoadingMessages && messagesError && (
                <Alert variant="destructive" className="mx-auto">
                  <AlertDescription>{messagesError}</AlertDescription>
                </Alert>
              )}

              {!isLoadingMessages &&
                !messagesError &&
                messages.length === 0 && (
                  <p className="text-center text-sm text-zinc-400">
                    Brak wiadomości. Napisz pierwszą wiadomość.
                  </p>
                )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      " max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      message.isOwn
                        ? "bg-baby-blue text-dark-navy"
                        : "bg-gold text-dark-navy"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[10px] opacity-70"
                      )}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form
              className="flex gap-2 p-3"
              onSubmit={(event) => {
                event.preventDefault()
                handleSend()
              }}
            >
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Napisz wiadomość…"
                maxLength={2000}
                disabled={isPending}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isPending || !draft.trim()}
                className="bg-baby-blue text-dark-navy hover:bg-baby-blue/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <p className="text-muted-foreground m-auto p-6 text-center text-sm">
            Wybierz rozmowę z listy.
          </p>
        )}
      </Card>
    </div>
  )
}
