const CHANNEL_PREFIX = "private-cooperation-"
const SEPARATOR = "__"

export function getCooperationChannelName(
  trainerId: string,
  traineeId: string
): string {
  return `${CHANNEL_PREFIX}${trainerId}${SEPARATOR}${traineeId}`
}

export function parseCooperationChannelName(
  channelName: string
): { trainerId: string; traineeId: string } | null {
  if (!channelName.startsWith(CHANNEL_PREFIX)) return null

  const rest = channelName.slice(CHANNEL_PREFIX.length)
  const parts = rest.split(SEPARATOR)
  if (parts.length !== 2) return null

  const [trainerId, traineeId] = parts
  if (!trainerId || !traineeId) return null

  return { trainerId, traineeId }
}
