import pg from 'pg'
import path from 'node:path'
import fs from 'node:fs'
import Postgrator from 'postgrator'

async function doMigration(): Promise<void> {
  const client = new pg.Client({
    connectionString: process.env.PG_CONNECTION_STRING
  })

  try {
    await client.connect()
    const migrationDir = path.join(import.meta.dirname, '../migrations')

    if (!fs.existsSync(migrationDir)) {
      throw new Error(
        `Migration directory "${migrationDir}" does not exist. Skipping migrations.`
      )
    }

    const postgrator = new Postgrator({
      migrationPattern: path.join(migrationDir, '*'),
      driver: 'pg',
      database: process.env.PG_DATABASE,
      currentSchema: 'public',
      schemaTable: 'schemaversion',
      execQuery: (query) => client.query(query)
    })

    const result = await postgrator.migrate()

    if (result.length === 0) {
      console.log(
        'No migrations run for schema "public". Already at the latest one.'
      )
    }

    console.log('Migration completed!')
    process.exitCode = 0
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  } finally {
    await client.end().catch(err => console.error(err))
  }
}

doMigration()
