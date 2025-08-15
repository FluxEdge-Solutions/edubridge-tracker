import { type Static, Type } from '@sinclair/typebox'
import { StringSchema, IdSchema } from './common.js'

export const SchoolSchema = Type.Object({
    id: IdSchema,
    name: StringSchema,
    base_url: StringSchema,
    logo_url: StringSchema,
    date_onboard: StringSchema
})

export interface School extends Static<typeof SchoolSchema> { }

export const CreateSchoolSchema = Type.Object({
    name: StringSchema,
    base_url: StringSchema,
    date_onboard: StringSchema
})

export const UpdateSchoolSchema = Type.Object({
    name: Type.Optional(StringSchema),
    base_url: Type.Optional(StringSchema),
    date_onboard: Type.Optional(StringSchema),
}) 