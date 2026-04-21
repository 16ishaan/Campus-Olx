import { NextResponse } from "next/server";
import type { Product } from "@/data/mockData";
import { getMysqlPool, isMysqlConfigured } from "@/lib/mysql";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

type ItemRow = RowDataPacket & Readonly<{
  item_id: number;
  user_id: number;
  category_id: number;
  title: string;
  price: string | number;
  condition_status: string;
  seller_name: string;
  seller_email: string;
  seller_phone: string;
  seller_image: string | null;
  seller_rating: string | number | null;
  seller_review_count: number;
}>;

type OwnedItemRow = RowDataPacket & Readonly<{
  item_id: number;
  seller_email: string;
}>;

type ItemImageRow = RowDataPacket & Readonly<{
  item_id: number;
  image_url: string;
}>;

type TrendingCategoryRow = RowDataPacket & Readonly<{
  category_id: number;
  item_count: number;
  review_avg: string | number | null;
}>;

type SellerRow = RowDataPacket & Readonly<{
  seller_id: number;
  name: string;
  email: string;
  campus_id: string | null;
}>;

const buildPlaceholderImage = (label: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#172034" />
          <stop offset="100%" stop-color="#0d1220" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#4e8dff" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#4e8dff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" rx="44" fill="url(#bg)" />
      <circle cx="620" cy="140" r="180" fill="url(#glow)" />
      <circle cx="190" cy="470" r="230" fill="url(#glow)" opacity="0.55" />
      <rect x="88" y="92" width="624" height="416" rx="32" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" />
      <text x="110" y="174" fill="white" font-family="Arial, sans-serif" font-size="42" font-weight="700">${label}</text>
      <text x="110" y="224" fill="rgba(255,255,255,0.78)" font-family="Arial, sans-serif" font-size="20">Campus listing image placeholder</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const uploadRoot = path.join(process.cwd(), "public", "uploads");

const ensureUploadDirectory = async (directoryPath: string): Promise<void> => {
  await mkdir(directoryPath, { recursive: true });
};

const getFileExtension = (file: File): string => {
  const match = file.type.match(/^image\/(png|jpe?g|webp|gif)$/i);
  if (match) {
    return match[1] === "jpeg" ? ".jpg" : `.${match[1]}`;
  }

  const fallbackExtension = path.extname(file.name);
  return fallbackExtension.length > 0 ? fallbackExtension : ".jpg";
};

const saveUploadedImage = async (file: File, folderName: string): Promise<string> => {
  const directoryPath = path.join(uploadRoot, folderName);
  await ensureUploadDirectory(directoryPath);

  const fileName = `${randomUUID()}${getFileExtension(file)}`;
  const filePath = path.join(directoryPath, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return `/uploads/${folderName}/${fileName}`;
};

const getNextId = async (connection: PoolConnection, tableName: string, columnName: string): Promise<number> => {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT COALESCE(MAX(${columnName}), 0) + 1 AS next_id FROM ${tableName}`,
  );

  return Number(rows[0]?.next_id ?? 1);
};

const categoryNameById: Readonly<Record<number, string>> = {
  1: "Electronics",
  2: "Books",
  3: "Furniture",
  4: "Clothing",
  5: "Sports",
  6: "Vehicles",
  7: "Stationery",
  8: "Appliances",
  9: "Accessories",
  10: "Others",
};

const normalizeProduct = (row: ItemRow, images: readonly string[]): Product => ({
  id: String(row.item_id),
  title: row.title,
  category: categoryNameById[row.category_id] ?? `Category ${row.category_id}`,
  price: String(row.price),
  postedAt: "Recently listed",
  description: `Listed on Campus Olx by ${row.seller_name}.`,
  condition: row.condition_status,
  sellerName: row.seller_name,
  sellerHandle: `@${row.seller_email.split("@")[0]}`,
  sellerEmail: row.seller_email,
  sellerPhone: row.seller_phone ?? undefined,
  sellerDorm: row.seller_phone ? `Phone ${row.seller_phone}` : "Campus seller",
  sellerRating:
    row.seller_rating === null
      ? "New seller"
      : `${Number(row.seller_rating).toFixed(1)} (${Number(row.seller_review_count ?? 0)} review${Number(row.seller_review_count ?? 0) === 1 ? "" : "s"})`,
  location: "Campus pickup",
  images: images.length > 0 ? images : [buildPlaceholderImage(row.title)],
  sellerImage: row.seller_image ?? undefined,
  featured: false,
});

export async function GET() {
  if (!isMysqlConfigured()) {
    return NextResponse.json(
      {
        error: "MySQL is not configured. Set MYSQL_URL or MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE.",
      },
      { status: 500 },
    );
  }

  try {
    const pool = getMysqlPool();
    const [itemRows] = await pool.query<ItemRow[]>(
      `
        SELECT
          i.item_id,
          i.user_id,
          i.category_id,
          i.title,
          i.price,
          i.condition_status,
          u.name AS seller_name,
          u.email AS seller_email,
          u.phone AS seller_phone,
          si.image_url AS seller_image,
          sr.seller_rating,
          sr.seller_review_count
        FROM items i
        INNER JOIN users u ON u.user_id = i.user_id
        LEFT JOIN sellers s ON s.email = u.email
        LEFT JOIN seller_img si ON si.seller_id = s.seller_id AND si.is_profile_pic = 1
        LEFT JOIN (
          SELECT
            i2.user_id,
            ROUND(AVG(r.rating), 1) AS seller_rating,
            COUNT(r.review_id) AS seller_review_count
          FROM items i2
          LEFT JOIN reviews r ON r.item_id = i2.item_id
          GROUP BY i2.user_id
        ) sr ON sr.user_id = i.user_id
        WHERE NOT EXISTS (
          SELECT 1
          FROM transactions tx
          WHERE tx.item_id = i.item_id
            AND LOWER(COALESCE(tx.status, '')) = 'completed'
        )
        ORDER BY i.item_id DESC
      `,
    );

    const [imageRows] = await pool.query<ItemImageRow[]>(
      `
        SELECT item_id, image_url
        FROM item_images
        ORDER BY image_id ASC
      `,
    );

    const [trendingRows] = await pool.query<TrendingCategoryRow[]>(
      `
        SELECT
          i.category_id,
          COUNT(DISTINCT i.item_id) AS item_count,
          AVG(r.rating) AS review_avg
        FROM items i
        LEFT JOIN reviews r ON r.item_id = i.item_id
        WHERE NOT EXISTS (
          SELECT 1
          FROM transactions tx
          WHERE tx.item_id = i.item_id
            AND LOWER(COALESCE(tx.status, '')) = 'completed'
        )
        GROUP BY i.category_id
        ORDER BY item_count DESC, COALESCE(review_avg, 0) DESC, i.category_id ASC
        LIMIT 1
      `,
    );

    const imagesByItemId = new Map<number, string[]>();

    for (const imageRow of imageRows) {
      const currentImages = imagesByItemId.get(imageRow.item_id) ?? [];
      currentImages.push(imageRow.image_url);
      imagesByItemId.set(imageRow.item_id, currentImages);
    }

    return NextResponse.json({
      products: itemRows.map((row) => normalizeProduct(row, imagesByItemId.get(row.item_id) ?? [])),
      trendingCategory:
        trendingRows.length > 0
          ? (categoryNameById[Number(trendingRows[0].category_id)] ?? `Category ${trendingRows[0].category_id}`)
          : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load products from MySQL.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isMysqlConfigured()) {
    return NextResponse.json(
      {
        error: "MySQL is not configured. Set MYSQL_URL or MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE.",
      },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const price = String(formData.get("price") ?? "").trim();
    const categoryId = Number(formData.get("categoryId") ?? 0);
    const conditionStatus = String(formData.get("conditionStatus") ?? "").trim();
    const sellerName = String(formData.get("sellerName") ?? "").trim();
    const sellerEmail = String(formData.get("sellerEmail") ?? "").trim();
    const sellerPhone = String(formData.get("sellerPhone") ?? "").trim();

    const photoFiles = formData
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);

    const sellerPhotoValue = formData.get("sellerPhoto");
    const sellerPhoto = sellerPhotoValue instanceof File && sellerPhotoValue.size > 0 ? sellerPhotoValue : null;

    if (!title || !price || !categoryId || !conditionStatus || !sellerName || !sellerEmail || !sellerPhone) {
      return NextResponse.json({ error: "All listing fields are required." }, { status: 400 });
    }

    if (photoFiles.length === 0) {
      return NextResponse.json({ error: "Please upload at least one item photo." }, { status: 400 });
    }

    const itemImageUrls = await Promise.all(photoFiles.map((file) => saveUploadedImage(file, "items")));
    const sellerImageUrl = sellerPhoto ? await saveUploadedImage(sellerPhoto, "sellers") : null;

    const pool = getMysqlPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [existingUserRows] = await connection.query<RowDataPacket[]>(
        "SELECT user_id FROM users WHERE email = ? OR phone = ? LIMIT 1",
        [sellerEmail, sellerPhone],
      );

      let userId: number;

      if (existingUserRows.length > 0) {
        userId = Number(existingUserRows[0].user_id);
        await connection.query("UPDATE users SET name = ?, email = ?, phone = ? WHERE user_id = ?", [sellerName, sellerEmail, sellerPhone, userId]);
      } else {
        userId = await getNextId(connection, "users", "user_id");
        await connection.query("INSERT INTO users (user_id, name, email, phone, created_at) VALUES (?, ?, ?, ?, NOW())", [
          userId,
          sellerName,
          sellerEmail,
          sellerPhone,
        ]);
      }

      const [existingSellerRows] = await connection.query<SellerRow[]>(
        "SELECT seller_id, name, email, campus_id FROM sellers WHERE email = ? LIMIT 1",
        [sellerEmail],
      );

      let sellerId: number;

      if (existingSellerRows.length > 0) {
        sellerId = Number(existingSellerRows[0].seller_id);
        await connection.query("UPDATE sellers SET name = ?, email = ? WHERE seller_id = ?", [sellerName, sellerEmail, sellerId]);
      } else {
        const [insertSellerResult] = await connection.query<ResultSetHeader>(
          "INSERT INTO sellers (name, email, created_at) VALUES (?, ?, NOW())",
          [sellerName, sellerEmail],
        );
        sellerId = Number(insertSellerResult.insertId);
      }

      const itemId = await getNextId(connection, "items", "item_id");
      await connection.query("INSERT INTO items (item_id, user_id, category_id, title, price, condition_status) VALUES (?, ?, ?, ?, ?, ?)", [
        itemId,
        userId,
        categoryId,
        title,
        price,
        conditionStatus,
      ]);

      let nextItemImageId = await getNextId(connection, "item_images", "image_id");

      for (const imageUrl of itemImageUrls) {
        await connection.query("INSERT INTO item_images (image_id, item_id, image_url) VALUES (?, ?, ?)", [nextItemImageId, itemId, imageUrl]);
        nextItemImageId += 1;
      }

      if (sellerImageUrl) {
        await connection.query("UPDATE seller_img SET is_profile_pic = 0 WHERE seller_id = ? AND is_profile_pic = 1", [sellerId]);
        const sellerImageId = await getNextId(connection, "seller_img", "image_id");
        await connection.query("INSERT INTO seller_img (image_id, seller_id, image_url, is_profile_pic, uploaded_at) VALUES (?, ?, ?, 1, NOW())", [sellerImageId, sellerId, sellerImageUrl]);
      }

      await connection.commit();

      const [createdRows] = await connection.query<ItemRow[]>(
        `
          SELECT
            i.item_id,
            i.user_id,
            i.category_id,
            i.title,
            i.price,
            i.condition_status,
            u.name AS seller_name,
            u.email AS seller_email,
            u.phone AS seller_phone,
            si.image_url AS seller_image,
            sr.seller_rating,
            sr.seller_review_count
          FROM items i
          INNER JOIN users u ON u.user_id = i.user_id
          LEFT JOIN sellers s ON s.email = u.email
          LEFT JOIN seller_img si ON si.seller_id = s.seller_id AND si.is_profile_pic = 1
            LEFT JOIN (
              SELECT
                i2.user_id,
                ROUND(AVG(r.rating), 1) AS seller_rating,
                COUNT(r.review_id) AS seller_review_count
              FROM items i2
              LEFT JOIN reviews r ON r.item_id = i2.item_id
              GROUP BY i2.user_id
            ) sr ON sr.user_id = i.user_id
          WHERE i.item_id = ?
          LIMIT 1
        `,
        [itemId],
      );

      const [createdImageRows] = await connection.query<ItemImageRow[]>(
        "SELECT item_id, image_url FROM item_images WHERE item_id = ? ORDER BY image_id ASC",
        [itemId],
      );

      const createdProduct = normalizeProduct(createdRows[0], createdImageRows.map((row) => row.image_url));

      return NextResponse.json({ product: createdProduct }, { status: 201 });
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create listing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isMysqlConfigured()) {
    return NextResponse.json(
      {
        error: "MySQL is not configured. Set MYSQL_URL or MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE.",
      },
      { status: 500 },
    );
  }

  try {
    const payload = (await request.json()) as Readonly<{
      itemId?: string | number;
      sellerEmail?: string;
    }>;

    const itemId = Number(payload.itemId);
    const sellerEmail = String(payload.sellerEmail ?? "").trim().toLowerCase();

    if (!itemId || !sellerEmail) {
      return NextResponse.json({ error: "Item id and seller email are required." }, { status: 400 });
    }

    const pool = getMysqlPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [ownedItemRows] = await connection.query<OwnedItemRow[]>(
        `
          SELECT i.item_id, u.email AS seller_email
          FROM items i
          INNER JOIN users u ON u.user_id = i.user_id
          WHERE i.item_id = ?
          LIMIT 1
        `,
        [itemId],
      );

      if (ownedItemRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: "Item not found." }, { status: 404 });
      }

      const ownerEmail = ownedItemRows[0].seller_email.trim().toLowerCase();
      if (ownerEmail !== sellerEmail) {
        await connection.rollback();
        return NextResponse.json({ error: "You can only delete your own item." }, { status: 403 });
      }

      const [imageRows] = await connection.query<ItemImageRow[]>(
        "SELECT image_url FROM item_images WHERE item_id = ?",
        [itemId],
      );

      await connection.query("DELETE FROM item_images WHERE item_id = ?", [itemId]);
      await connection.query("DELETE FROM items WHERE item_id = ?", [itemId]);
      await connection.commit();

      await Promise.all(
        imageRows.map(async (row) => {
          const relativePath = row.image_url.startsWith("/") ? row.image_url.slice(1) : row.image_url;
          if (relativePath.startsWith("uploads/")) {
            await rm(path.join(process.cwd(), "public", relativePath), { force: true });
          }
        }),
      );

      return NextResponse.json({ success: true });
    } catch (deleteError) {
      await connection.rollback();
      throw deleteError;
    } finally {
      connection.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete item.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}