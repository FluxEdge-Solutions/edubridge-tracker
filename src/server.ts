import Fastify from 'fastify'
import fp from 'fastify-plugin'
import closeWithGrace from 'close-with-grace'
import serviceApp from './app.js'
import FastifyVite from '@fastify/vite'
import { resolve } from 'path'

function getLoggerOptions() {
  // Only if the program is running in an interactive terminal
  if (process.stdout.isTTY) {
    return {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    }
  }

  return { level: process.env.LOG_LEVEL ?? 'silent' }
}

const app = Fastify({
  logger: getLoggerOptions(),
  ajv: {
    customOptions: {
      coerceTypes: 'array', // change type of data to match type keyword
      removeAdditional: 'all' // Remove additional body properties
    }
  }
})

async function init() {
  // Register your application as a normal plugin.
  // fp must be used to override default error handler
  app.register(fp(serviceApp))

  await app.register(FastifyVite, {
    root: resolve(import.meta.dirname, '..'),
    distDir: resolve(import.meta.dirname, '..', 'build'), // Must match build.outDir in Vite config
    dev: process.argv.includes('--dev'),
    spa: true,
  })

  app.get('/', async function (req, reply) {
    return reply.html()
  })


  // Delay is the number of milliseconds for the graceful close to finish
  closeWithGrace(
    //@ts-ignore
    { delay: process.env.FASTIFY_CLOSE_GRACE_DELAY ?? 500 },
    async ({ err }) => {
      if (err != null) {
        app.log.error(err)
      }

      await app.close()
    }
  )
  await app.vite.ready()
  await app.ready()

  try {
    // Start listening.
    await app.listen({ port: 3000, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

init()
