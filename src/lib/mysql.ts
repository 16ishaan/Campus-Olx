import "server-only";

import { createPool, type Pool, type PoolOptions } from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __campusOlxMysqlPool: Pool | undefined;
}

const hasIndividualMysqlConfig = (): boolean => {
  return Boolean(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE);
};

export const isMysqlConfigured = (): boolean => {
  return Boolean(process.env.MYSQL_URL || hasIndividualMysqlConfig());
};

const buildPoolOptions = (): PoolOptions => {
  if (process.env.MYSQL_URL) {
    const connectionUrl = new URL(process.env.MYSQL_URL);
    const databaseName = connectionUrl.pathname.replace(/^\//, "");

    if (!databaseName) {
      throw new Error("MYSQL_URL must include a database name, for example mysql://user:password@host:3306/database");
    }

    return {
      host: connectionUrl.hostname,
      port: connectionUrl.port ? Number(connectionUrl.port) : 3306,
      user: decodeURIComponent(connectionUrl.username),
      password: decodeURIComponent(connectionUrl.password),
      database: databaseName,
      connectionLimit: 10,
    };
  }

  if (!hasIndividualMysqlConfig()) {
    throw new Error("Missing MySQL configuration. Set MYSQL_URL or MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE.");
  }

  return {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 10,
  };
};

export const getMysqlPool = (): Pool => {
  if (!globalThis.__campusOlxMysqlPool) {
    globalThis.__campusOlxMysqlPool = createPool(buildPoolOptions());
  }

  return globalThis.__campusOlxMysqlPool;
};