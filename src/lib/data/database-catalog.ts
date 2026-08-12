import { diagramFromJSONInput } from '@/lib/export-import-utils';
import type { Diagram } from '@/lib/domain/diagram';

export interface DatabaseCatalogEntry {
    file: string;
    diagram: Diagram;
}

const CATALOG_BASE_PATH = `${import.meta.env.BASE_URL}databases/`;

export const fetchDatabaseCatalog = async (): Promise<
    DatabaseCatalogEntry[]
> => {
    const indexResponse = await fetch(`${CATALOG_BASE_PATH}index.json`);
    if (!indexResponse.ok) {
        return [];
    }

    const files: string[] = await indexResponse.json();

    const entries = await Promise.all(
        files.map(async (file): Promise<DatabaseCatalogEntry | null> => {
            try {
                const response = await fetch(`${CATALOG_BASE_PATH}${file}`);
                if (!response.ok) {
                    return null;
                }
                const json = await response.text();
                return { file, diagram: diagramFromJSONInput(json) };
            } catch {
                return null;
            }
        })
    );

    return entries.filter(
        (entry): entry is DatabaseCatalogEntry => entry !== null
    );
};
