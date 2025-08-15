import {
    type FastifyPluginAsyncTypebox,
    Type
} from '@fastify/type-provider-typebox'
import { CreateSchoolSchema, UpdateSchoolSchema } from '../../../schemas/school.js'
import path from 'path'

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
    const { schoolRepository, schoolFileManager, fileManager } = fastify

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
                    tags: ['Schools']
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
                        const fileNameSplit = file.filename.split(".");
                        const fileExtension = fileNameSplit[fileNameSplit.length - 1];

                        const newFilename = `${fileManager.randomSuffix()}.${fileExtension}`
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

    fastify.get(
        '/:id/image',
        {
            schema: {
                params: Type.Object({
                    id: Type.Number()
                }),
                response: {
                    200: { type: 'string', contentMediaType: 'image/*' },
                    404: Type.Object({ message: Type.String() })
                },
                tags: ['Schools']
            }
        },
        async function (request, reply) {
            const { id } = request.params

            const school = await schoolRepository.findSchoolById(id)
            if (!school) {
                return reply.notFound(`School not found`)
            }

            return reply.sendFile(
                school.logo_url as string,
                path.join(
                    fastify.config.UPLOAD_DIRNAME,
                    fastify.config.UPLOAD_SCHOOL_DIRNAME
                )
            )
        }
    )

    fastify.delete(
        '/:filename/image',
        {
            schema: {
                params: Type.Object({
                    filename: Type.String()
                }),
                response: {
                    204: Type.Null(),
                    404: Type.Object({ message: Type.String() })
                },
                tags: ['Schools']
            }
        },
        async function (request, reply) {
            const { filename } = request.params

            return fastify.knex
                .transaction(async (trx) => {
                    const hasBeenUpdated = await schoolRepository.deleteFilename(filename, null, trx)

                    if (!hasBeenUpdated) {
                        return reply.notFound(`No school has filename "${filename}"`)
                    }

                    await schoolFileManager.delete(filename)

                    reply.code(204)

                    return { message: 'File deleted successfully' }
                })
        }
    )

}

export default plugin