import { auth } from "@/auth"
import { getChatConversations } from "@/actions/chat"
import { ChatView } from "@/components/pages/chat/chat-view"
import { redirect } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

type ChatPageProps = {
  searchParams: Promise<{
    trainer?: string
    trainee?: string
  }>
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/?unauthorized=true")
  }

  const params = await searchParams
  const conversationsResult = await getChatConversations()

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

  if (session.user.role === "trainer" && params.trainee) {
    initialTrainerId = session.user.id
    initialTraineeId = params.trainee
  }

  if (session.user.role === "trainee" && params.trainer) {
    initialTrainerId = params.trainer
    initialTraineeId = session.user.id
  }

  return (
    <div className="lg:h-[calc(100dvh-120px)] h-[calc(100dvh-90px)] flex flex-col min-h-0 ">

      <ChatView
        conversations={conversations}
        currentUserId={session.user.id}
        initialTrainerId={initialTrainerId}
        initialTraineeId={initialTraineeId}
        pusherKey={pusherKey}
        pusherCluster={pusherCluster}
      />
    </div>
  )
}
