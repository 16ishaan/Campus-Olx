# Campus Olx

Premium campus marketplace front end built with Next.js, Tailwind CSS, and Framer Motion.

## Run locally

```bash
npm install
npm run dev
```

## MySQL Setup

Add a `.env.local` file with either a single connection string or individual fields:

```bash
MYSQL_URL=mysql://user:password@localhost:3306/campus_olx

# Or:
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=campus_olx
```

This app is now wired to these existing tables in your `campus_olx` database:

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
