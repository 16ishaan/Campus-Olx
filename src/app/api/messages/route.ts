import { NextResponse } from "next/server";
import { getMysqlConfigErrorMessage, getMysqlPool, isMysqlConfigured } from "@/lib/mysql";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

type ItemOwnerRow = RowDataPacket & Readonly<{
  item_id: number;
  user_id: number;
  seller_name: string;
  seller_email: string | null;
}>;

type InboxMessageRow = RowDataPacket & Readonly<{
  message_id: number;
  message: string | null;
  timestamp: string | null;
  item_id: number;
  item_title: string;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
}>;

const getNextId = async (connection: PoolConnection, tableName: string, columnName: string): Promise<number> => {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT COALESCE(MAX(${columnName}), 0) + 1 AS next_id FROM ${tableName}`,
  );

  return Number(rows[0]?.next_id ?? 1);
};

export async function GET(request: Request) {
  if (!isMysqlConfigured()) {
    return NextResponse.json(
      {
        error: getMysqlConfigErrorMessage(),
      },
      { status: 500 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const sellerEmail = String(searchParams.get("sellerEmail") ?? "").trim().toLowerCase();

    if (!sellerEmail) {
      return NextResponse.json({ error: "Seller email is required." }, { status: 400 });
    }

    const pool = getMysqlPool();
    const [rows] = await pool.query<InboxMessageRow[]>(
      `
        SELECT
          m.message_id,
          m.message,
          m.timestamp,
          m.item_id,
          i.title AS item_title,
          buyer.name AS buyer_name,
          buyer.email AS buyer_email,
          buyer.phone AS buyer_phone
        FROM messages m
        INNER JOIN users seller ON seller.user_id = m.receiver_id
        INNER JOIN users buyer ON buyer.user_id = m.sender_id
        INNER JOIN items i ON i.item_id = m.item_id
        WHERE LOWER(seller.email) = ?
        ORDER BY m.timestamp DESC, m.message_id DESC
      `,
      [sellerEmail],
    );

    return NextResponse.json({
      messages: rows.map((row) => ({
        id: row.message_id,
        itemId: row.item_id,
        itemTitle: row.item_title,
        message: row.message ?? "",
        sentAt: row.timestamp,
        buyerName: row.buyer_name,
        buyerEmail: row.buyer_email,
        buyerPhone: row.buyer_phone,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load inbox messages.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
      buyerName?: string;
      buyerEmail?: string;
      buyerPhone?: string;
      message?: string;
    }>;

    const itemId = Number(payload.itemId);
    const buyerName = String(payload.buyerName ?? "").trim();
    const buyerEmail = String(payload.buyerEmail ?? "").trim().toLowerCase();
    const buyerPhone = String(payload.buyerPhone ?? "").trim();
    const message = String(payload.message ?? "").trim();

    if (!itemId || !buyerName || !buyerEmail || !message) {
      return NextResponse.json({ error: "Item id, buyer name, buyer email, and message are required." }, { status: 400 });
    }

    const pool = getMysqlPool();
    const connection = await pool.getConnection();

    try {
      const [ownerRows] = await connection.query<ItemOwnerRow[]>(
        `
          SELECT i.item_id, i.user_id, u.name AS seller_name, u.email AS seller_email
          FROM items i
          INNER JOIN users u ON u.user_id = i.user_id
          WHERE i.item_id = ?
          LIMIT 1
        `,
        [itemId],
      );

      if (ownerRows.length === 0) {
        return NextResponse.json({ error: "Item not found." }, { status: 404 });
      }

      const ownerRow = ownerRows[0];

      await connection.beginTransaction();

      const [existingSenderRows] = await connection.query<RowDataPacket[]>(
        "SELECT user_id FROM users WHERE email = ? LIMIT 1",
        [buyerEmail],
      );

      let senderId: number;

      if (existingSenderRows.length > 0) {
        senderId = Number(existingSenderRows[0].user_id);
        await connection.query("UPDATE users SET name = ?, email = ?, phone = ? WHERE user_id = ?", [buyerName, buyerEmail, buyerPhone || null, senderId]);
      } else {
        senderId = await getNextId(connection, "users", "user_id");
        await connection.query("INSERT INTO users (user_id, name, email, phone, created_at) VALUES (?, ?, ?, ?, NOW())", [
          senderId,
          buyerName,
          buyerEmail,
          buyerPhone || null,
        ]);
      }

      const receiverId = Number(ownerRow.user_id);

      if (senderId === receiverId) {
        await connection.rollback();
        return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });
      }

      const messageId = await getNextId(connection, "messages", "message_id");

      await connection.query<ResultSetHeader>(
        "INSERT INTO messages (message_id, sender_id, receiver_id, item_id, message, timestamp) VALUES (?, ?, ?, ?, ?, NOW())",
        [messageId, senderId, receiverId, itemId, message],
      );

      await connection.commit();

      return NextResponse.json(
        {
          success: true,
          messageId,
          sellerName: ownerRow.seller_name,
          sellerEmail: ownerRow.seller_email,
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
    const message = error instanceof Error ? error.message : "Failed to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}