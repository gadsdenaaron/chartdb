import { diagramFromJSONInput } from '@/lib/export-import-utils';
import { importDBMLToDiagram } from '@/lib/dbml/dbml-import/dbml-import';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';

export interface DatabaseCatalogEntry {
    file: string;
    diagram: Diagram;
}

interface DatabaseCatalogIndexEntry {
    file: string;
    databaseType?: DatabaseType;
}

const CATALOG_BASE_PATH = `${import.meta.env.BASE_URL}databases/`;

const parseCatalogIndex = (raw: unknown): DatabaseCatalogIndexEntry[] => {
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw
        .map((item): DatabaseCatalogIndexEntry | null => {
            if (typeof item === 'string') {
                return { file: item };
            }
            if (item && typeof item === 'object' && 'file' in item) {
                return item as DatabaseCatalogIndexEntry;
            }
            return null;
        })
        .filter((item): item is DatabaseCatalogIndexEntry => item !== null);
};

const loadCatalogEntry = async ({
    file,
    databaseType,
}: DatabaseCatalogIndexEntry): Promise<DatabaseCatalogEntry | null> => {
    try {
        const response = await fetch(`${CATALOG_BASE_PATH}${file}`);
        if (!response.ok) {
            return null;
        }
        const content = await response.text();

        if (file.toLowerCase().endsWith('.dbml')) {
            const diagram = await importDBMLToDiagram(content, {
                databaseType: databaseType ?? DatabaseType.GENERIC,
            });
            const baseName = file
                .replace(/\.dbml$/i, '')
                .split('/')
                .pop();
            return {
                file,
                diagram: baseName ? { ...diagram, name: baseName } : diagram,
            };
        }

        return { file, diagram: diagramFromJSONInput(content) };
    } catch {
        return null;
    }
};

export const fetchDatabaseCatalog = async (): Promise<
    DatabaseCatalogEntry[]
> => {
    const indexResponse = await fetch(`${CATALOG_BASE_PATH}index.json`);
    if (!indexResponse.ok) {
        return [];
    }

    const index = parseCatalogIndex(await indexResponse.json());

    const entries = await Promise.all(index.map(loadCatalogEntry));

    return entries.filter(
        (entry): entry is DatabaseCatalogEntry => entry !== null
    );
};
