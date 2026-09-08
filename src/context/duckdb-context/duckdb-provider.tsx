import React, { useCallback, useRef, useState } from 'react';
import type * as duckdbNs from '@duckdb/duckdb-wasm';
import type { AsyncDuckDB, AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import { duckdbContext, type DuckDBStatus } from './duckdb-context';

export const DuckDBProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [status, setStatus] = useState<DuckDBStatus>('idle');
    const [error, setError] = useState<Error | undefined>();

    const dbRef = useRef<AsyncDuckDB | null>(null);
    const connRef = useRef<AsyncDuckDBConnection | null>(null);
    const initPromiseRef = useRef<Promise<AsyncDuckDB> | null>(null);

    const ensureInitialized = useCallback((): Promise<AsyncDuckDB> => {
        if (initPromiseRef.current) {
            return initPromiseRef.current;
        }

        const init = async (): Promise<AsyncDuckDB> => {
            setStatus('initializing');
            setError(undefined);

            // Dynamically imported so @duckdb/duckdb-wasm's JS glue isn't
            // pulled into the eagerly-loaded editor bundle — it's only
            // fetched the first time a console/connector actually needs it.
            const duckdb: typeof duckdbNs = await import('@duckdb/duckdb-wasm');
            const { DUCKDB_BUNDLES } =
                await import('@/lib/duckdb/duckdb-bundles');

            const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);
            if (!bundle.mainWorker) {
                throw new Error('DuckDB bundle selection returned no worker');
            }
            const worker = new Worker(bundle.mainWorker);
            const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
            const db = new duckdb.AsyncDuckDB(logger, worker);
            await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

            dbRef.current = db;
            connRef.current = await db.connect();
            setStatus('ready');

            return db;
        };

        const promise = init().catch((err: unknown) => {
            const initError =
                err instanceof Error ? err : new Error(String(err));
            setStatus('error');
            setError(initError);
            initPromiseRef.current = null;
            throw initError;
        });

        initPromiseRef.current = promise;
        return promise;
    }, []);

    const getConnection =
        useCallback(async (): Promise<AsyncDuckDBConnection> => {
            await ensureInitialized();
            if (!connRef.current) {
                throw new Error('DuckDB connection is not available');
            }
            return connRef.current;
        }, [ensureInitialized]);

    const reset = useCallback(async (): Promise<void> => {
        await connRef.current?.close();
        await dbRef.current?.terminate();
        connRef.current = null;
        dbRef.current = null;
        initPromiseRef.current = null;
        setStatus('idle');
        setError(undefined);
    }, []);

    return (
        <duckdbContext.Provider
            value={{
                status,
                error,
                ensureInitialized,
                getConnection,
                reset,
            }}
        >
            {children}
        </duckdbContext.Provider>
    );
};
