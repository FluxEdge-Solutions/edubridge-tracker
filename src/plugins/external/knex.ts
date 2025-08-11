import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify';
import knex, { type Knex } from 'knex';

declare module 'fastify' {
  export interface FastifyInstance {
    knex: Knex;
  }
}

export const autoConfig = (fastify: FastifyInstance) => {
  return {
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
    searchPath: ['knex', 'public'],
    pool: { min: 2, max: 10 }
  }
}

export default fp(async (fastify: FastifyInstance, opts) => {
  fastify.decorate('knex', knex(opts))

  fastify.addHook('onClose', async (instance) => {
    await instance.knex.destroy()
  })
}, { name: 'knex' })
