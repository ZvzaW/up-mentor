import pino from "pino"

const globalForLogger = globalThis as unknown as {
  baseLogger: pino.Logger | undefined
}

function createBaseLogger(): pino.Logger {
  const level = "info"
  const isProduction = process.env.NODE_ENV === "production"

  if (isProduction) {
    return pino({ level })
  }

  return pino({
    level,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
      },
    },
  })
}

export const baseLogger = globalForLogger.baseLogger ?? createBaseLogger()

if (process.env.NODE_ENV !== "production") {
  globalForLogger.baseLogger = baseLogger
}
