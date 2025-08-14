import pg, { type Client } from 'pg';
import { scryptHash } from '../src/plugins/app/password-manager.js';

if (Number(process.env.CAN_SEED_DATABASE) !== 1) {
  throw new Error(
    "You can't seed the database. Set `CAN_SEED_DATABASE=1` environment variable to allow this operation."
  );
}

async function seed() {
  const client = new pg.Client({
    connectionString: process.env.PG_CONNECTION_STRING
  });
  await client.connect();

  try {
    // await truncateTables(client);
    await seedUsers(client);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.end();
  }
}

async function truncateTables(connection: Client) {
  // Get all table names in the public schema
  const { rows } = await connection.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `);

  if (rows.length > 0) {
    const tableNames = rows.map(r => `"${r.tablename}"`).join(', ');

    await connection.query('SET session_replication_role = replica'); // Disable FK checks
    try {
      await connection.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
      console.log('All tables have been truncated successfully.');
    } finally {
      await connection.query('SET session_replication_role = DEFAULT'); // Re-enable FK checks
    }
  }
}

async function seedUsers(connection: Client) {
  const users = [
    { username: 'basic', email: 'basic@example.com' },
    { username: 'moderator', email: 'moderator@example.com' },
    { username: 'admin', email: 'admin@example.com' }
  ];
  const hash = await scryptHash('Password123$');

  const rolesAccumulator: number[] = [];

  for (const user of users) {
    // Insert user
    const userResult = await connection.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [user.username, user.email, hash]
    );

    const userId = userResult.rows[0].id;

    // Insert role
    const roleResult = await connection.query(
      `INSERT INTO roles (name)
       VALUES ($1)
       RETURNING id`,
      [user.username]
    );

    const newRoleId = roleResult.rows[0].id;

    rolesAccumulator.push(newRoleId);

    // Assign accumulated roles to the current user
    for (const roleId of rolesAccumulator) {
      await connection.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)`,
        [userId, roleId]
      );
    }
  }

  console.log('Users have been seeded successfully.');
}

seed();
