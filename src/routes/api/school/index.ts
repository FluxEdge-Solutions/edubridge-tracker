import {
    type FastifyPluginAsyncTypebox,
    Type
} from '@fastify/type-provider-typebox'
import { CreateSchoolSchema, UpdateSchoolSchema } from '../../../schemas/school.js'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
    const { schoolRepository, schoolFileManager } = fastify

    fastify.post("/", {
        schema: {
            body: CreateSchoolSchema,
            response: {
                200: Type.Object({
                    success: Type.Boolean(),
                    message: Type.String(),
                }),
                401: Type.Object({
                    message: Type.String()
                })
            },
            tags: ["Schools"]
        },
    }, async function (request, replay) {
        await schoolRepository.create(request.body)

        replay.code(201)

        return {
            success: true,
            message: "school added successfully",
        }
    }),


        fastify.get("/", {
            schema: {
                response: {
                    200: Type.Object({
                        success: Type.Boolean(),
                        message: Type.String(),
                    }),
                },
                tags: ["Schools"]
            }
        }, async function (_request, reply) {
            const schools = await schoolRepository.findSchools()

            reply.code(201)

            return {
                success: true,
                message: "List of schools",
                data: schools
            }
        }),

        fastify.put("/:id", {
            schema: {
                body: UpdateSchoolSchema,
                params: Type.Object({
                    id: Type.Number()
                }),
                response: {
                    200: Type.Object({
                        status: Type.Boolean(),
                        message: Type.String()
                    }),
                    401: Type.Object({
                        message: Type.String()
                    })
                }
            }
        }, async function (request, reply) {
            const { id } = request.params
            await schoolRepository.updateSchool(request.body, id)

            reply.code(200)
            return {
                status: true,
                message: "School updated successfully"
            }
        }),
        fastify.post(
            '/:id/upload',
            {
                schema: {
                    params: Type.Object({
                        id: Type.Number()
                    }),
                    consumes: ['multipart/form-data'],
                    response: {
                        200: Type.Object({
                            message: Type.String()
                        }),
                        404: Type.Object({ message: Type.String() }),
                        400: Type.Object({ message: Type.String() })
                    },
                    tags: ['Tasks']
                }
            },
            async function (request, reply) {
                const { id } = request.params

                const file = await request.file()
                if (!file) {
                    return reply.notFound('File not found')
                }

                if (file.file.truncated) {
                    return reply.badRequest('File size limit exceeded')
                }

                const allowedMimeTypes = ['image/jpeg', 'image/png']
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    return reply.badRequest('Invalid file type')
                }

                const existingSchool = await schoolRepository.findSchoolById(id)
                if (!existingSchool) {
                    return reply.notFound('School not not found')
                }

                let oldTempFilename: string | undefined
                const oldFilename = existingSchool.logo_url
                if (oldFilename) {
                    oldTempFilename = await schoolFileManager.moveOldToTemp(oldFilename)
                }

                return fastify.knex
                    .transaction(async (trx) => {
                        const newFilename = `${id}_${file.filename}`
                        await schoolRepository.updateSchool({ logo_url: newFilename }, id, trx)

                        await schoolFileManager.upload(newFilename, file)

                        return { message: 'File uploaded successfully' }
                    })
                    .catch(async (err) => {
                        if (oldFilename && oldTempFilename) {
                            await schoolFileManager.moveTempToOld(oldTempFilename, oldFilename)
                        }

                        throw err
                    })
            }
        )

}

export default plugin