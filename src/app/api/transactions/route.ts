import { NextResponse } from "next/server";
import { getMysqlConfigErrorMessage, getMysqlPool, isMysqlConfigured } from "@/lib/mysql";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

type ItemRow = RowDataPacket & Readonly<{
  item_id: number;
  user_id: number;
  title: string;
  price: string | number;
}>;

type SummaryRow = RowDataPacket & Readonly<{
  transaction_id: number;
  buyer: string | null;
  title: string;
  amount: string | number | null;
  status: string | null;
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
    const itemId = Number(searchParams.get("itemId"));

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required." }, { status: 400 });
    }

    const pool = getMysqlPool();
    const [rows] = await pool.query<SummaryRow[]>(
      `
        SELECT ts.transaction_id, ts.buyer, ts.title, ts.amount, ts.status
        FROM transactionsummary ts
        INNER JOIN transactions t ON t.transaction_id = ts.transaction_id
        WHERE t.item_id = ?
        ORDER BY ts.transaction_id DESC
        LIMIT 15
      `,
      [itemId],
    );

    return NextResponse.json({
      transactions: rows.map((row) => ({
        transactionId: row.transaction_id,
        buyer: row.buyer ?? "Unknown",
        title: row.title,
        amount: row.amount === null ? null : Number(row.amount),
        status: row.status ?? "Pending",
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load transactions.";
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
      paymentMethod?: string;
    }>;

    const itemId = Number(payload.itemId);
    const buyerName = String(payload.buyerName ?? "").trim();
    const buyerEmail = String(payload.buyerEmail ?? "").trim().toLowerCase();
    const buyerPhone = String(payload.buyerPhone ?? "").trim();
    const paymentMethod = String(payload.paymentMethod ?? "Cash").trim() || "Cash";

    if (!itemId || !buyerName || !buyerEmail) {
      return NextResponse.json({ error: "itemId, buyerName, and buyerEmail are required." }, { status: 400 });
    }

    const pool = getMysqlPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [itemRows] = await connection.query<ItemRow[]>(
        "SELECT item_id, user_id, title, price FROM items WHERE item_id = ? LIMIT 1",
        [itemId],
      );

      if (itemRows.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: "Item not found." }, { status: 404 });
      }

      const item = itemRows[0];

      const [completedRows] = await connection.query<RowDataPacket[]>(
        "SELECT transaction_id FROM transactions WHERE item_id = ? AND LOWER(COALESCE(status, '')) = 'completed' LIMIT 1",
        [itemId],
      );

      if (completedRows.length > 0) {
        await connection.rollback();
        return NextResponse.json({ error: "This item is already sold." }, { status: 409 });
      }

      const [existingBuyerRows] = await connection.query<RowDataPacket[]>(
        "SELECT user_id FROM users WHERE email = ? LIMIT 1",
        [buyerEmail],
      );

      let buyerId: number;

      if (existingBuyerRows.length > 0) {
        buyerId = Number(existingBuyerRows[0].user_id);
        await connection.query("UPDATE users SET name = ?, phone = ? WHERE user_id = ?", [buyerName, buyerPhone || null, buyerId]);
      } else {
        buyerId = await getNextId(connection, "users", "user_id");
        await connection.query("INSERT INTO users (user_id, name, email, phone, created_at) VALUES (?, ?, ?, ?, NOW())", [
          buyerId,
          buyerName,
          buyerEmail,
          buyerPhone || null,
        ]);
      }

      if (buyerId === Number(item.user_id)) {
        await connection.rollback();
        return NextResponse.json({ error: "You cannot buy your own item." }, { status: 400 });
      }

      const transactionId = await getNextId(connection, "transactions", "transaction_id");
      const amount = Number(item.price ?? 0);

      await connection.query<ResultSetHeader>(
        "INSERT INTO transactions (transaction_id, buyer_id, item_id, amount, status) VALUES (?, ?, ?, ?, ?)",
        [transactionId, buyerId, itemId, amount, "Completed"],
      );

      // Some existing DB setup paths may default status to Pending; enforce completed after paid transaction creation.
      await connection.query("UPDATE transactions SET status = ? WHERE transaction_id = ?", ["Completed", transactionId]);

      const paymentId = await getNextId(connection, "payments", "payment_id");
      await connection.query<ResultSetHeader>(
        "INSERT INTO payments (payment_id, transaction_id, payment_method, payment_status) VALUES (?, ?, ?, ?)",
        [paymentId, transactionId, paymentMethod, "Paid"],
      );

      const [summaryRows] = await connection.query<SummaryRow[]>(
        "SELECT transaction_id, buyer, title, amount, status FROM transactionsummary WHERE transaction_id = ? LIMIT 1",
        [transactionId],
      );

      await connection.commit();

      return NextResponse.json(
        {
          success: true,
          transaction: summaryRows[0]
            ? {
                transactionId: summaryRows[0].transaction_id,
                buyer: summaryRows[0].buyer ?? buyerName,
                title: summaryRows[0].title,
                amount: summaryRows[0].amount === null ? amount : Number(summaryRows[0].amount),
                status: summaryRows[0].status ?? "Completed",
              }
            : {
                transactionId,
                buyer: buyerName,
                title: item.title,
                amount,
                status: "Completed",
              },
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
    const message = error instanceof Error ? error.message : "Failed to create transaction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}