import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin'
import { type SchoolDetils, type School } from '../../../schemas/school.js';

declare module 'fastify' {
    interface FastifyInstance {
        schoolRepository: ReturnType<typeof createSchoolRepository>;
    }
}

export function createSchoolRepository(fastify: FastifyInstance) {
    const knex = fastify.knex;

    return {
        async findSchoolByBaseUrl(baseUrl: string) {
            return knex<School>("schools")
                .select("id", "name", "base_url", "logo_url", "date_onboard")
                .where({ base_url: baseUrl })
                .first()
        },

        async findSchoolById(id: number) {
            return knex<School>("schools")
                .select("id", "name", "base_url", "logo_url", "date_onboard")
                .where({ id })
                .first()
        },

        async findSchools() {
            return knex<School[]>("schools")
                .select("id", "name", "base_url", "logo_url", "date_onboard")
        },

        async updateSchool(newSchool: SchoolDetils, id: string) {
            return knex("schools").where({ id }).update(newSchool)
        },

        async removeSchool(id: string) {
            return knex("schools").where({ id }).delete()
        },

        async create(school: SchoolDetils) {
            const id = await knex("schools").insert(school)
            return id
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
