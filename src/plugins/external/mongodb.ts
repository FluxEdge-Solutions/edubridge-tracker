import { mongodb } from "@fastify/mongodb";

export const autoConfig = () => {
    return {
        forceClose: true,
        url: 'mongodb://mongo/mydb'
    }
}

export default mongodb