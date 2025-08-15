import {
    type FastifyPluginAsyncTypebox,
    Type
} from '@fastify/type-provider-typebox'
import { CredentialsSchema } from '../../../schemas/auth.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
    const { usersRepository, passwordManager } = fastify
    fastify.post(
        '/login',
        {
            schema: {
                body: CredentialsSchema,
                response: {
                    200: Type.Object({
                        success: Type.Boolean(),
                        message: Type.String()
                    }),
                    401: Type.Object({
                        message: Type.String()
                    })
                },
                tags: ["Authentication"]
            }
        },
        async function (request, reply) {
            const { email, password } = request.body
            return fastify.knex.transaction(async (knex) => {
                const user = await usersRepository.findByEmail(email, knex);

                if (user) {
                    const isPasswordValid = await passwordManager.compare(password, user.password)

                    if (isPasswordValid) {
                        const roles = await usersRepository.findUserRolesByEmail(email, knex)

                        request.session.user = {
                            id: user.id,
                            email: user.email,
                            username: user.username,
                            roles: roles.map((role) => role.name)
                        }

                        await request.session.save()

                        return { success: true, message: "Login successful!" }
                    }
                }

                reply.status(401)
                return { message: "Invalid email or password!" }
            })
        }
    )
}

export default plugin