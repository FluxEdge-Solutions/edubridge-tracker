import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get("/welcome", {}, async (req, res) => {
        res.status(200)
        return { message: "welcome" }
    })
}

export default plugin