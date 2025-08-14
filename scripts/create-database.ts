import pg, { type Client } from 'pg'

if (Number(process.env.CAN_CREATE_DATABASE) !== 1) {
  throw new Error("You can't create the database. Set `CAN_CREATE_DATABASE=1` environment variable to allow this operation.")
}

async function createDatabase() {
  const client = new pg.Client({
    connectionString: process.env.PG_CONNECTION_STRING
  })

  await client.connect()

  try {
    await createDB(client)
    console.log(`Database ${process.env.MYSQL_DATABASE} has been created successfully.`)
  } catch (error) {
    console.error('Error creating database:', error)
  } finally {
    await client.end()
  }
}


async function createDB(client: Client) {
  await client.query(`CREATE DATABASE "${process.env.PG_DATABASE}"`)
  console.log(`Database ${process.env.PG_DATABASE} created or already exists.`)
}

createDatabase()
