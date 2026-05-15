# Campus Olx

Premium campus marketplace front end built with Next.js, Tailwind CSS, and Framer Motion.

## Run locally

```bash
npm install
npm run dev
```

## MySQL Setup

Copy `.env.example` to `.env.local` and fill in your local MySQL credentials. Keep `.env.local` out of Git. If you deploy to Vercel, add the same values in Project Settings -> Environment Variables.

For moving the database off your local machine and onto a public MySQL host, see [database/MIGRATE.md](database/MIGRATE.md).

```bash
MYSQL_URL=mysql://your-user:your-password@your-host:3306/your_database

# Vercel can also use:
DATABASE_URL=mysql://your-user:your-password@your-host:3306/your_database

# Or:
MYSQL_HOST=your-host
MYSQL_PORT=3306
MYSQL_USER=your-user
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=your_database
```

This app is wired to the existing tables in your MySQL database:

- `items`
- `item_images`
- `users`
- `seller_img`

Expected columns used by the API:

```sql
items(item_id, user_id, category_id, title, price, condition_status)
item_images(image_id, item_id, image_url)
users(user_id, name, email, phone)
seller_img(image_id, seller_id, image_url, is_profile_pic)
```

## Notes

- Placeholder data still lives in `src/data/mockData.ts` for the local demo UI.
- The home page now loads its listings from `/api/products`, which reads only from your MySQL tables above.
