import type { DuckDBBundles } from '@duckdb/duckdb-wasm';
import mvpWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import mvpWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import ehWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import ehWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';

// Only the non-threaded mvp/eh bundles are shipped: the "coi" bundle needs
// COOP/COEP response headers, which GitHub Pages (static hosting) cannot set.
export const DUCKDB_BUNDLES: DuckDBBundles = {
    mvp: { mainModule: mvpWasmUrl, mainWorker: mvpWorkerUrl },
    eh: { mainModule: ehWasmUrl, mainWorker: ehWorkerUrl },
};
