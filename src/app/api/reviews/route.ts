import { NextResponse } from "next/server";
import { getMysqlConfigErrorMessage, getMysqlPool, isMysqlConfigured } from "@/lib/mysql";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

type ItemOwnerRow = RowDataPacket & Readonly<{
  item_id: number;
  user_id: number;
}>;

const getNextId = async (connection: PoolConnection, tableName: string, columnName: string): Promise<number> => {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT COALESCE(MAX(${columnName}), 0) + 1 AS next_id FROM ${tableName}`,
  );

  return Number(rows[0]?.next_id ?? 1);
};

export async function POST(request: Request) {
  if (!isMysqlConfigured()) {
    return NextResponse.json(
      {
        error: getMysqlConfigErrorMessage(),
      },
      { status: 500 },
    );
  }

  try {
    const payload = (await request.json()) as Readonly<{
      itemId?: string | number;
      reviewerName?: string;
      reviewerEmail?: string;
      reviewerPhone?: string;
      rating?: string | number;
      comment?: string;
    }>;

    const itemId = Number(payload.itemId);
    const reviewerName = String(payload.reviewerName ?? "").trim();
    const reviewerEmail = String(payload.reviewerEmail ?? "").trim().toLowerCase();
    const reviewerPhone = String(payload.reviewerPhone ?? "").trim();
    const rating = Number(payload.rating);
    const comment = String(payload.comment ?? "").trim();

    if (!itemId || !reviewerName || !reviewerEmail || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Item, reviewer details, and rating (1-5) are required." }, { status: 400 });
    }

    const pool = getMysqlPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [itemRows] = await connection.query<ItemOwnerRow[]>(
        "SELECT item_id, user_id FROM items WHERE item_id = ? LIMIT 1",
        [itemId],
      );

      if (itemRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: "Item not found." }, { status: 404 });
      }

      const [existingReviewerRows] = await connection.query<RowDataPacket[]>(
        "SELECT user_id FROM users WHERE email = ? LIMIT 1",
        [reviewerEmail],
      );

      let reviewerId: number;

      if (existingReviewerRows.length > 0) {
        reviewerId = Number(existingReviewerRows[0].user_id);
        await connection.query("UPDATE users SET name = ?, phone = ? WHERE user_id = ?", [reviewerName, reviewerPhone || null, reviewerId]);
      } else {
        reviewerId = await getNextId(connection, "users", "user_id");
        await connection.query("INSERT INTO users (user_id, name, email, phone, created_at) VALUES (?, ?, ?, ?, NOW())", [
          reviewerId,
          reviewerName,
          reviewerEmail,
          reviewerPhone || null,
        ]);
      }

      const sellerUserId = Number(itemRows[0].user_id);
      if (reviewerId === sellerUserId) {
        await connection.rollback();
        return NextResponse.json({ error: "You cannot review your own listing." }, { status: 400 });
      }

      const reviewId = await getNextId(connection, "reviews", "review_id");

      await connection.query<ResultSetHeader>(
        "INSERT INTO reviews (review_id, user_id, item_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
        [reviewId, reviewerId, itemId, Math.round(rating), comment || null],
      );

      const [ratingRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT ROUND(AVG(r.rating), 1) AS seller_rating, COUNT(r.review_id) AS seller_review_count
          FROM items i
          LEFT JOIN reviews r ON r.item_id = i.item_id
          WHERE i.user_id = ?
        `,
        [sellerUserId],
      );

      await connection.commit();

      return NextResponse.json(
        {
          success: true,
          reviewId,
          sellerRating: Number(ratingRows[0]?.seller_rating ?? 0),
          sellerReviewCount: Number(ratingRows[0]?.seller_review_count ?? 0),
        },
        { status: 201 },
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit review.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}