import Pusher from "pusher"

function getPusherConfig() {
  const appId = process.env.PUSHER_APP_ID
  const key = process.env.PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.PUSHER_CLUSTER

  if (!appId || !key || !secret || !cluster) {
    return null
  }

  return { appId, key, secret, cluster }
}

export function isPusherConfigured(): boolean {
  return getPusherConfig() !== null
}

let pusherInstance: Pusher | null = null

export function getPusherServer(): Pusher | null {
  const config = getPusherConfig()
  if (!config) return null

  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: config.appId,
      key: config.key,
      secret: config.secret,
      cluster: config.cluster,
      useTLS: true,
    })
  }

  return pusherInstance
}
