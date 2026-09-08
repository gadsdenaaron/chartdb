import { z } from 'zod';
import type { DataSourceConnector } from '../data-source-connector';

export interface LocalFileConnectionInfo {
    id: string;
    kind: 'localFile';
    name: string;
    authStrategy: { kind: 'none' };
    file: File;
    // Sanitized name DuckDB refers to this file by, e.g. in
    // read_csv_auto('<registeredFileName>').
    registeredFileName: string;
}

const localFileConnectionSchema: z.ZodType<LocalFileConnectionInfo> = z.object({
    id: z.string().min(1),
    kind: z.literal('localFile'),
    name: z.string().min(1),
    authStrategy: z.object({ kind: z.literal('none') }),
    file: z.instanceof(File),
    registeredFileName: z.string().min(1),
});

export const localFileConnector: DataSourceConnector<LocalFileConnectionInfo> =
    {
        kind: 'localFile',
        configSchema: localFileConnectionSchema,
        registerSource: async (db, _conn, config) => {
            const buffer = new Uint8Array(await config.file.arrayBuffer());
            await db.registerFileBuffer(config.registeredFileName, buffer);
        },
        // No unregisterSource: DuckDB-wasm doesn't require explicit file
        // deregistration for correctness. A future hook for hygiene (e.g.
        // db.dropFile) can be added once the console supports removing
        // files without a full engine reset.
    };
