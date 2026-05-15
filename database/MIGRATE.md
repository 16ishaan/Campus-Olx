# Cloud MySQL Migration

This app cannot use `DESKTOP-TCQ89E1` from Vercel because that host is only reachable on your local network.

## What to do

1. Create a cloud MySQL database with a public connection string.
2. Run [`schema.sql`](schema.sql) on the new database.
3. Import your existing data from the old local MySQL instance.
4. Set the new connection string in Vercel as `DATABASE_URL` or `MYSQL_URL`.
5. Redeploy the app.

If you want a scripted copy instead of a manual export/import, use:

```bash
SOURCE_MYSQL_URL=mysql://user:password@localhost:3306/campus_olx
TARGET_MYSQL_URL=mysql://user:password@public-host:3306/campus_olx
npm run migrate:mysql
```

The script copies the app tables in dependency order and rebuilds `transactionsummary`.

## Environment variables

Use one of these in Vercel:

```bash
MYSQL_URL=mysql://user:password@public-host:3306/campus_olx
```

or

```bash
DATABASE_URL=mysql://user:password@public-host:3306/campus_olx
```

## Notes

- Keep `.env.local` out of Git.
- `schema.sql` matches the tables used by the app APIs.
- If your cloud MySQL provider supports importing a dump, export from the local DB and import into the new one before updating Vercel.
