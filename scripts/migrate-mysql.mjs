import mysql from "mysql2/promise";

const sourceUrl = process.env.SOURCE_MYSQL_URL ?? process.env.MYSQL_URL ?? process.env.DATABASE_URL;
const targetUrl = process.env.TARGET_MYSQL_URL ?? process.env.MIGRATION_MYSQL_URL ?? process.env.DEPLOY_MYSQL_URL;

if (!sourceUrl || !targetUrl) {
  console.error(
    "Missing connection string(s). Set SOURCE_MYSQL_URL for the source database and TARGET_MYSQL_URL for the cloud database.",
  );
  process.exit(1);
}

const tablesInOrder = [
  { name: "users", columns: ["user_id", "name", "email", "phone", "created_at"] },
  { name: "sellers", columns: ["seller_id", "name", "email", "campus_id", "created_at"] },
  { name: "items", columns: ["item_id", "user_id", "category_id", "title", "price", "condition_status", "created_at"] },
  { name: "item_images", columns: ["image_id", "item_id", "image_url"] },
  { name: "reviews", columns: ["review_id", "user_id", "item_id", "rating", "comment", "created_at"] },
  { name: "transactions", columns: ["transaction_id", "buyer_id", "item_id", "amount", "status", "created_at"] },
  { name: "payments", columns: ["payment_id", "transaction_id", "payment_method", "payment_status", "created_at"] },
  { name: "messages", columns: ["message_id", "sender_id", "receiver_id", "item_id", "message", "timestamp"] },
  { name: "seller_img", columns: ["image_id", "seller_id", "image_url", "is_profile_pic", "uploaded_at"] },
];

const targetTablesToClear = [...tablesInOrder].reverse();

const sourcePool = await mysql.createPool({
  uri: sourceUrl,
  connectionLimit: 2,
});

const targetPool = await mysql.createPool({
  uri: targetUrl,
  connectionLimit: 2,
  multipleStatements: true,
});

const quoteIdentifier = (identifier) => `\`${identifier.replaceAll("`", "``")}\``;

const insertRows = async (connection, tableName, columns, rows) => {
  if (rows.length === 0) {
    return;
  }

  const columnList = columns.map(quoteIdentifier).join(", ");
  const placeholders = `(${columns.map(() => "?").join(", ")})`;
  const values = rows.map((row) => columns.map((column) => row[column]));
  const sql = `INSERT INTO ${quoteIdentifier(tableName)} (${columnList}) VALUES ${values.map(() => placeholders).join(", ")}`;
  const flattenedValues = values.flat();

  await connection.query(sql, flattenedValues);
};

try {
  const sourceConnection = await sourcePool.getConnection();
  const targetConnection = await targetPool.getConnection();

  try {
    console.log("Preparing target database...");
    await targetConnection.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of targetTablesToClear) {
      await targetConnection.query(`DELETE FROM ${quoteIdentifier(table.name)}`);
    }
    await targetConnection.query("SET FOREIGN_KEY_CHECKS = 1");

    for (const table of tablesInOrder) {
      const columnList = table.columns.map(quoteIdentifier).join(", ");
      const [rows] = await sourceConnection.query(`SELECT ${columnList} FROM ${quoteIdentifier(table.name)} ORDER BY ${quoteIdentifier(table.columns[0])} ASC`);

      console.log(`Copying ${table.name}: ${rows.length} row(s)`);
      await insertRows(targetConnection, table.name, table.columns, rows);
    }

    console.log("Rebuilding transactionsummary view...");
    await targetConnection.query(`
      CREATE OR REPLACE VIEW transactionsummary AS
      SELECT
        t.transaction_id AS transaction_id,
        buyer.name AS buyer,
        i.title AS title,
        t.amount AS amount,
        t.status AS status
      FROM transactions t
      INNER JOIN users buyer ON buyer.user_id = t.buyer_id
      INNER JOIN items i ON i.item_id = t.item_id
    `);

    console.log("Migration completed successfully.");
  } finally {
    sourceConnection.release();
    targetConnection.release();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await Promise.allSettled([sourcePool.end(), targetPool.end()]);
}
