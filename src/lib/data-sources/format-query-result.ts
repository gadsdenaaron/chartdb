import type { QueryResult, QueryResultColumn } from './data-source-connector';

// Structural subset of apache-arrow's `Table` that DuckDB-wasm's
// `conn.query()` resolves to. Kept narrow (rather than importing the full
// `apache-arrow` Table type) so this function is unit-testable with a plain
// hand-built object, no real Arrow/WASM engine required.
export interface ArrowResultLike {
    schema: {
        fields: { name: string; type: { toString(): string } }[];
    };
    toArray(): ArrowRowLike[];
}

type ArrowRowLike =
    | Record<string, unknown>
    | { toJSON: () => Record<string, unknown> };

const rowToPlainObject = (row: ArrowRowLike): Record<string, unknown> =>
    'toJSON' in row && typeof row.toJSON === 'function'
        ? row.toJSON()
        : (row as Record<string, unknown>);

export const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) {
        return 'NULL';
    }
    if (typeof value === 'bigint') {
        return value.toString();
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value, (_key, v) =>
            typeof v === 'bigint' ? v.toString() : v
        );
    }
    return String(value);
};

export const arrowResultToQueryResult = (
    result: ArrowResultLike,
    durationMs: number
): QueryResult => {
    const columns: QueryResultColumn[] = result.schema.fields.map((field) => ({
        name: field.name,
        type: field.type.toString(),
    }));

    const rows = result.toArray().map(rowToPlainObject);

    return {
        columns,
        rows,
        rowCount: rows.length,
        durationMs,
    };
};
