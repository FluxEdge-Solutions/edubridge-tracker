import { type Static, Type } from '@sinclair/typebox'
import { DateTimeSchema, StringSchema } from './common.js'

export const SchoolSchema = Type.Object({
    name: StringSchema,
    base_url: StringSchema,
    logo_url: StringSchema,
    date_onboard: DateTimeSchema
})

export interface SchoolDetils extends Static<typeof SchoolSchema> {}

export interface School {
    id: number,
    name: string,
    base_url: string,
    logo_url: string,
    date_onboard: Date
}