import { QueryClient } from "@tanstack/react-query";

import {
  DatabaseConnection,
  listActivityLogs,
  listWords,
} from "../db";
import { queryKeys } from "./queryKeys";

export const wordListQuery = (db: DatabaseConnection) => ({
  queryKey: queryKeys.words(),
  queryFn: () => listWords(db),
});

export const activityLogsQuery = (db: DatabaseConnection) => ({
  queryKey: queryKeys.activityLogs(),
  queryFn: () => listActivityLogs(db),
});

export const prefetchWordList = (
  client: QueryClient,
  db: DatabaseConnection,
) => client.prefetchQuery(wordListQuery(db));

export const prefetchActivityLogs = (
  client: QueryClient,
  db: DatabaseConnection,
) => client.prefetchQuery(activityLogsQuery(db));
