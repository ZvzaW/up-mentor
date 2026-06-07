import { headers } from "next/headers"
import { baseLogger } from "./logger"

export const getLogger = async () => {
  let correlationId = "system-process"

  const headersList = await headers()
  const headerId = headersList.get("x-correlation-id")
  if (headerId) {
    correlationId = headerId
  }

  return baseLogger.child({ reqId: correlationId })
}
