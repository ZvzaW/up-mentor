import { auth } from "@/auth"
import { parseCooperationChannelName } from "@/lib/chat-channel"
import { prisma } from "@/lib/prisma"
import { getPusherServer } from "@/lib/pusher-server"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const pusher = getPusherServer()
  if (!pusher) {
    return new Response("Pusher not configured", { status: 503 })
  }

  const body = await request.text()
  const params = new URLSearchParams(body)
  const socketId = params.get("socket_id")
  const channelName = params.get("channel_name")

  if (!socketId || !channelName) {
    return new Response("Bad request", { status: 400 })
  }

  const parsed = parseCooperationChannelName(channelName)
  if (!parsed) {
    return new Response("Forbidden", { status: 403 })
  }

  const { trainerId, traineeId } = parsed
  const userId = session.user.id
  const role = session.user.role

  const isParticipant =
    (role === "trainer" && userId === trainerId) ||
    (role === "trainee" && userId === traineeId)

  if (!isParticipant) {
    return new Response("Forbidden", { status: 403 })
  }

  const cooperation = await prisma.cooperation.findFirst({
    where: {
      trainer_id: trainerId,
      trainee_id: traineeId,
      status: "active",
    },
    select: { trainer_id: true },
  })

  if (!cooperation) {
    return new Response("Forbidden", { status: 403 })
  }

  const authResponse = pusher.authorizeChannel(socketId, channelName)
  return Response.json(authResponse)
}
