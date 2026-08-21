import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const { rows } = await pool.query(
  `SELECT (SELECT count(*) FROM "User") AS users, (SELECT count(*) FROM "Article") AS articles`
);
console.log(`DB OK - users: ${rows[0].users}, articles: ${rows[0].articles}`);
await pool.end();
