import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin'
import { CreateSchoolSchema, UpdateSchoolSchema } from '../../../schemas/school.js';
import type { School } from '../../../schemas/school.js';
import type { Static } from '@fastify/type-provider-typebox';
import type { Knex } from 'knex';

declare module 'fastify' {
    interface FastifyInstance {
        schoolRepository: ReturnType<typeof createSchoolRepository>;
    }
}

type CreateSchool = Static<typeof CreateSchoolSchema>
interface UpdateSchool extends Static<typeof UpdateSchoolSchema> {
    logo_url?: string
}

export function createSchoolRepository(fastify: FastifyInstance) {
    const knex = fastify.knex;
    const TABLENAME = "schools_on"

    return {
        async findSchoolByBaseUrl(baseUrl: string) {
            return knex<School>(TABLENAME)
                .select("id", "name", "base_url", "logo_url", "date_onboard")
                .where({ base_url: baseUrl })
                .first()
        },

        async findSchoolById(id: number) {
            return knex<School>(TABLENAME)
                .select("id", "name", "base_url", "logo_url", "date_onboard")
                .where({ id })
                .first()
        },

        async findSchools() {
            return knex<School>(TABLENAME)
                .select("id", "name", "base_url", "logo_url", "date_onboard")
        },

        async updateSchool(newSchool: UpdateSchool, id: number, trx?: Knex) {
            const affectedRows = await (trx ?? knex)(TABLENAME).where({ id }).update(newSchool)

            if (affectedRows === 0) {
                return null
            }

            return this.findSchoolById(id)
        },

        async removeSchool(id: string) {
            return knex(TABLENAME).where({ id }).delete()
        },

        async findByFilename(filename: string) {
            return knex(TABLENAME)
                .select("logo_url")
                .where({ logo_url: filename })
                .first()
        },

        async create(school: CreateSchool) {
            const id = await knex(TABLENAME).insert(school)
            return id
        },

        async deleteFilename(filename: string, value: string | null, trx: Knex) {
            const affectedRows = await trx(TABLENAME)
                .where({ filename })
                .update({ filename: value })

            return affectedRows > 0
        },

        async delete(id: number) {
            const affectedRows = await knex<School>(TABLENAME).where({ id }).delete()

            return affectedRows > 0
        }

    }
}

export default fp(
    async function (fastify: FastifyInstance) {
        const repo = createSchoolRepository(fastify)
        fastify.decorate('schoolRepository', repo)
    },
    {
        name: 'schools-repository',
        dependencies: ['knex']
    }
)
