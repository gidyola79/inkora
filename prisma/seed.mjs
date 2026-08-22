import "dotenv/config";
import pg from "pg";
import { randomUUID } from "node:crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

function isLocalDatabase(url) {
  try {
    return ["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

const pool = new pg.Pool({
  connectionString,
  ...(isLocalDatabase(connectionString)
    ? {}
    : { ssl: { rejectUnauthorized: false } }),
});

function q(sql, params = []) {
  return pool.query(sql, params);
}
async function one(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0];
}

const writer = await one("SELECT * FROM \"User\" WHERE email = 'writer@inkora.dev'");
const reader = await one("SELECT * FROM \"User\" WHERE email = 'reader@inkora.dev'");

if (!writer || !reader) {
  console.error(
    "Seed users not found. Create them first via POST /api/auth/sign-up/email:\n" +
      '  {"name":"Ava Writer","email":"writer@inkora.dev","password":"password123"}\n' +
      '  {"name":"Remy Reader","email":"reader@inkora.dev","password":"password123"}'
  );
  process.exit(1);
}
console.log("writer:", writer.id, "username:", writer.username);
console.log("reader:", reader.id, "username:", reader.username);

// Reset demo content so re-runs are idempotent
for (const table of ["Message", "ConversationParticipant", "Conversation", "Flashcard", "FlashcardSet", "Notification", "Comment", "Repost", "Like", "Follow", "Article"]) {
  await q(`DELETE FROM "${table}"`);
}

// Profile fields + usernames for users created before additionalFields was wired up
await q('UPDATE "User" SET username = $1, bio = $2, gender = $3 WHERE id = $4', [
  "ava",
  "Writing about craft, shipping, and the long game.",
  "female",
  writer.id,
]);
await q('UPDATE "User" SET username = $1, bio = $2 WHERE id = $3', [
  "remy",
  "Avid reader. I turn pages and take notes.",
  reader.id,
]);
const owner = await one("SELECT * FROM \"User\" WHERE email = 'olamidexgideon@gmail.com'");
if (owner) {
  await q('UPDATE "User" SET username = $1 WHERE id = $2', ["olamide", owner.id]);
}

// Articles
const art1 = randomUUID();
const art2 = randomUUID();
const art3 = randomUUID();

const content1 = `# The Quiet Art of Finishing

> "Done is better than perfect."

Most people start things. Few finish them. This is about the **quiet art** of *finishing* — the discipline of closing the loop.

## Ship small

- Write the ugly first draft.
- Cut it in half.
- Publish.

### The danger of polish

Polish is procrastination wearing a nice shirt. H~2~O chemistry aside, the real variable is **momentum**. Inline code looks like \`console.log("done")\`.

## Subscripts and superscripts

The formula for water is H~2~O and Einstein's equation is E=mc^2^.

## A list that matters

1. Start
2. Keep going
3. Stop when it's done

---

That's it. Nothing fancy. Just finish.`;

const content2 = `# Notes on Building in Public

Building in public is a **superpower** disguised as a habit.

## Why it works

- Accountability makes you finish.
- The audience gives feedback before you launch.
- Your process becomes your marketing.

## The cost

Not everyone is nice. Learn to read the *useful* noise and ignore the rest.

> Show your work, but protect your energy.`;

// Yesterday's date according to the machine running the seed (i.e., YOUR
// calendar), rendered as an ISO timestamp Postgres stores as-is. Mid-day
// hours keep it on yesterday's calendar date for viewers in nearby zones.
function yesterdayAt(hours) {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(hours).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:00:00`;
}

await q(
  `INSERT INTO "Article" (id, "authorId", title, slug, content, excerpt, status, "createdAt", "updatedAt", "publishedAt")
   VALUES ($1, $2, $3, $4, $5, $6, 'PUBLISHED', $7::timestamptz, $7::timestamptz, $7::timestamptz)`,
  [art1, writer.id, "The Quiet Art of Finishing", "the-quiet-art-of-finishing", content1,
   "Why the discipline of closing the loop beats starting new things.", yesterdayAt(10)]
);

await q(
  `INSERT INTO "Article" (id, "authorId", title, slug, content, excerpt, status, "createdAt", "updatedAt", "publishedAt")
   VALUES ($1, $2, $3, $4, $5, $6, 'PUBLISHED', $7::timestamptz, $7::timestamptz, $7::timestamptz)`,
  [art2, writer.id, "Notes on Building in Public", "notes-on-building-in-public", content2,
   "Sharing your process is a superpower disguised as a habit.", yesterdayAt(15)]
);

await q(
  `INSERT INTO "Article" (id, "authorId", title, slug, content, excerpt, status, "createdAt", "updatedAt", "publishedAt")
   VALUES ($1, $2, $3, $4, $5, NULL, 'DRAFT', now(), now(), NULL)`,
  [art3, writer.id, "A Draft I'm Not Done With", "a-draft-im-not-done-with",
   "This one is still cooking. Drafts are allowed to be messy."]
);

// Follows (reader follows writer; writer follows reader)
await q('INSERT INTO "Follow" (id, "followerId", "followingId", "createdAt") VALUES ($1, $2, $3, now())',
  [randomUUID(), reader.id, writer.id]);
await q('INSERT INTO "Follow" (id, "followerId", "followingId", "createdAt") VALUES ($1, $2, $3, now())',
  [randomUUID(), writer.id, reader.id]);

// Likes + repost on article 1 by reader
await q('INSERT INTO "Like" (id, "articleId", "userId", "createdAt") VALUES ($1, $2, $3, now())',
  [randomUUID(), art1, reader.id]);
await q('INSERT INTO "Repost" (id, "articleId", "userId", "createdAt") VALUES ($1, $2, $3, now())',
  [randomUUID(), art1, reader.id]);

// Comment on article 1 by reader
const commentId = randomUUID();
await q('INSERT INTO "Comment" (id, "articleId", "authorId", content, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, now(), now())',
  [commentId, art1, reader.id, "The section on subscripts is the best part. H~2~O forever!"]);

// Notifications for writer
await q('INSERT INTO "Notification" (id, "userId", "actorId", type, "articleId", "readAt", "createdAt") VALUES ($1, $2, $3, \'FOLLOW\', NULL, NULL, now())',
  [randomUUID(), writer.id, reader.id]);
await q('INSERT INTO "Notification" (id, "userId", "actorId", type, "articleId", "readAt", "createdAt") VALUES ($1, $2, $3, \'LIKE\', $4, NULL, now())',
  [randomUUID(), writer.id, reader.id, art1]);
await q('INSERT INTO "Notification" (id, "userId", "actorId", type, "articleId", "readAt", "createdAt") VALUES ($1, $2, $3, \'REPOST\', $4, NULL, now())',
  [randomUUID(), writer.id, reader.id, art1]);
await q('INSERT INTO "Notification" (id, "userId", "actorId", type, "articleId", "commentId", "readAt", "createdAt") VALUES ($1, $2, $3, \'COMMENT\', $4, $5, NULL, now())',
  [randomUUID(), writer.id, reader.id, art1, commentId]);

// Announcements for both
await q('INSERT INTO "Notification" (id, "userId", "actorId", type, "articleId", "readAt", "createdAt") VALUES ($1, $2, NULL, \'ANNOUNCEMENT\', NULL, NULL, now())',
  [randomUUID(), writer.id]);
await q('INSERT INTO "Notification" (id, "userId", "actorId", type, "articleId", "readAt", "createdAt") VALUES ($1, $2, NULL, \'ANNOUNCEMENT\', NULL, NULL, now())',
  [randomUUID(), reader.id]);

// Flashcard set for article 1 by writer
const setId = randomUUID();
await q('INSERT INTO "FlashcardSet" (id, "userId", title, "articleId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, now(), now())',
  [setId, writer.id, "Key ideas from The Quiet Art of Finishing", art1]);

const cards = [
  ["What is 'done' compared to?", "Perfect — 'Done is better than perfect.'"],
  ["What does polish become?", "Procrastination wearing a nice shirt."],
  ["What is the chemical formula for water?", "H~2~O (subscript support in markdown)."],
  ["What does E=mc^2^ demonstrate?", "Superscript support in markdown."],
];
for (let i = 0; i < cards.length; i++) {
  const [front, back] = cards[i];
  await q('INSERT INTO "Flashcard" (id, "setId", front, back, "order", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, now(), now())',
    [randomUUID(), setId, front, back, i]);
}

// Empty conversation between writer and reader (for live E2EE testing)
const convId = randomUUID();
await q('INSERT INTO "Conversation" (id, "createdAt", "updatedAt") VALUES ($1, now(), now())', [convId]);
await q('INSERT INTO "ConversationParticipant" (id, "conversationId", "userId", "createdAt") VALUES ($1, $2, $3, now())',
  [randomUUID(), convId, writer.id]);
await q('INSERT INTO "ConversationParticipant" (id, "conversationId", "userId", "createdAt") VALUES ($1, $2, $3, now())',
  [randomUUID(), convId, reader.id]);

console.log("Seed complete.");
await pool.end();