import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const outputPath = path.resolve("analysis/icaart_2027_db_catalog.json");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [[databaseRow]] = await connection.query("SELECT DATABASE() AS databaseName");
  const [tables] = await connection.query(
    `SELECT table_name AS tableName, table_type AS tableType
       FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY table_name`
  );
  const [columns] = await connection.query(
    `SELECT table_name AS tableName,
            ordinal_position AS ordinalPosition,
            column_name AS columnName,
            column_type AS columnType,
            is_nullable AS isNullable,
            column_key AS columnKey,
            extra
       FROM information_schema.columns
      WHERE table_schema = DATABASE()
      ORDER BY table_name, ordinal_position`
  );

  const catalog = {
    generatedAtUtc: new Date().toISOString(),
    databaseName: databaseRow.databaseName,
    tableCount: tables.length,
    tables: tables.map((table) => ({
      ...table,
      columns: columns.filter((column) => column.tableName === table.tableName),
    })),
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Catalogued ${catalog.tableCount} tables.`);
  console.log(`Output: ${outputPath}`);
  console.log(catalog.tables.map((table) => table.tableName).join("\n"));
} finally {
  await connection.end();
}
