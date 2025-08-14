import pg, { type Client } from 'pg'

if (Number(process.env.CAN_DROP_DATABASE) !== 1) {
  throw new Error("You can't drop the database. Set `CAN_DROP_DATABASE=1` environment variable to allow this operation.")
}

async function dropDatabase() {
  const client = new pg.Client({
    connectionString: process.env.PG_CONNECTION_STRING
  })

  try {
    await dropDB(client)
    console.log(`Database ${process.env.PG_DATABASE} has been dropped successfully.`)
  } catch (error) {
    console.error('Error dropping database:', error)
  } finally {
    await client.end()
  }
}

async function dropDB(connection: Client) {
  await connection.query(`DROP DATABASE "${process.env.PG_DATABASE}"`)
  console.log(`Database ${process.env.PG_DATABASE} dropped.`)
}

dropDatabase()
