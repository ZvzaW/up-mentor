import { auth } from "@/auth"
import { getChatConversations } from "@/lib/server-get-functions/chat"
import { ChatView } from "@/components/pages/chat/chat-view"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { user_role } from "@prisma/client"
import { redirect } from "next/navigation"

type ChatPageProps = {
  searchParams: Promise<{
    trainer?: string
    trainee?: string
  }>
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const session = await auth()
  if (!session?.user?.id || !session.user.role) {
    redirect("/?unauthorized=true")
  }
  const userId = session.user.id
  const role = session.user.role

  const params = await searchParams
  const conversationsResult = await getChatConversations(userId, role)

  if (conversationsResult.error) {
    return (
      <Alert variant="destructive" className="mx-auto mt-8">
        <AlertDescription>{conversationsResult.error}</AlertDescription>
      </Alert>
    )
  }

  const conversations = conversationsResult.data ?? []
  const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY ?? ""
  const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu"

  let initialTrainerId = params.trainer
  let initialTraineeId = params.trainee

  if (role === user_role.trainer && params.trainee) {
    initialTrainerId = userId
    initialTraineeId = params.trainee
  }

  if (role === user_role.trainee && params.trainer) {
    initialTrainerId = params.trainer
    initialTraineeId = userId
  }

  return (
    <div className="flex h-[calc(100dvh-90px)] min-h-0 flex-col lg:h-[calc(100dvh-120px)]">
      <ChatView
        conversations={conversations}
        currentUserId={userId}
        initialTrainerId={initialTrainerId}
        initialTraineeId={initialTraineeId}
        pusherKey={pusherKey}
        pusherCluster={pusherCluster}
      />
    </div>
  )
}
