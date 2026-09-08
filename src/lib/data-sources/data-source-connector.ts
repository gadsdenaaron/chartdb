import type { z } from 'zod';
import type { AsyncDuckDB, AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import type { AuthStrategy } from './auth-strategy';

// 'localFile' ships in v1. 'azureDelta' is the anticipated fast-follow —
// listed here so DataSourceKind doesn't need to change shape when it lands.
export type DataSourceKind = 'localFile' | 'azureDelta';

export interface DataSourceConnectionInfo {
    id: string;
    kind: DataSourceKind;
    name: string;
    authStrategy: AuthStrategy;
}

export interface QueryResultColumn {
    name: string;
    type: string;
}

export interface QueryResult {
    columns: QueryResultColumn[];
    rows: Record<string, unknown>[];
    rowCount: number;
    durationMs: number;
}

// Deliberately no `query(sql)` method here: running SQL is a property of the
// shared DuckDB connection (a single query can join across multiple
// registered sources), not of any one connector. Each connector's job is
// only to make its source visible to DuckDB.
export interface DataSourceConnector<
    TConfig extends DataSourceConnectionInfo = DataSourceConnectionInfo,
> {
    kind: DataSourceKind;

    configSchema: z.ZodType<TConfig>;

    // Registers whatever this source needs with the DuckDB engine so SQL can
    // reference it (e.g. registerFileBuffer for local files; future: a
    // CREATE SECRET + ATTACH/delta_scan for Azure). Idempotent per config.id.
    registerSource: (
        db: AsyncDuckDB,
        conn: AsyncDuckDBConnection,
        config: TConfig
    ) => Promise<void>;

    // Optional: relation/table names this source exposes after
    // registration. Not used by the v1 UI, but part of the contract so a
    // future schema browser doesn't need new connector methods.
    listRelations?: (
        conn: AsyncDuckDBConnection,
        config: TConfig
    ) => Promise<string[]>;

    // Teardown (revoke object URLs, drop temp views, close remote handles).
    unregisterSource?: (
        conn: AsyncDuckDBConnection,
        config: TConfig
    ) => Promise<void>;
}
