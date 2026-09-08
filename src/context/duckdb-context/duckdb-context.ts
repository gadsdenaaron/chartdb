import { createContext } from 'react';
import type { AsyncDuckDB, AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import { emptyFn } from '@/lib/utils';

export type DuckDBStatus = 'idle' | 'initializing' | 'ready' | 'error';

export interface DuckDBContext {
    status: DuckDBStatus;
    error: Error | undefined;
    // Lazily creates the worker/wasm module on first call; concurrent/later
    // calls share the same in-flight or resolved promise.
    ensureInitialized: () => Promise<AsyncDuckDB>;
    // Convenience for callers that just want a connection; awaits
    // ensureInitialized() internally.
    getConnection: () => Promise<AsyncDuckDBConnection>;
    reset: () => Promise<void>;
}

export const duckdbContext = createContext<DuckDBContext>({
    status: 'idle',
    error: undefined,
    ensureInitialized: emptyFn,
    getConnection: emptyFn,
    reset: emptyFn,
});
