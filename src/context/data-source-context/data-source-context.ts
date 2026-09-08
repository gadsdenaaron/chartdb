import { createContext } from 'react';
import type { DataSourceRegistry } from '@/lib/data-sources/connector-registry';
import type { DataSourceConnectionInfo } from '@/lib/data-sources/data-source-connector';
import { emptyFn } from '@/lib/utils';

export interface DataSourceContext {
    registry: DataSourceRegistry;
    connections: DataSourceConnectionInfo[];
    addConnection: (connection: DataSourceConnectionInfo) => void;
    removeConnection: (connectionId: string) => void;
}

export const dataSourceContext = createContext<DataSourceContext>({
    registry: {
        register: emptyFn,
        get: emptyFn,
        list: () => [],
    },
    connections: [],
    addConnection: emptyFn,
    removeConnection: emptyFn,
});
