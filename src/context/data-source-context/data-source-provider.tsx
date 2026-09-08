import React, { useCallback, useRef, useState } from 'react';
import { dataSourceContext } from './data-source-context';
import { createDataSourceRegistry } from '@/lib/data-sources/connector-registry';
import { localFileConnector } from '@/lib/data-sources/connectors/local-file-connector';
import type { DataSourceConnectionInfo } from '@/lib/data-sources/data-source-connector';

export const DataSourceProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const registryRef = useRef(createDataSourceRegistry());
    registryRef.current.register(localFileConnector);

    const [connections, setConnections] = useState<DataSourceConnectionInfo[]>(
        []
    );

    const addConnection = useCallback(
        (connection: DataSourceConnectionInfo) => {
            setConnections((prev) => [...prev, connection]);
        },
        []
    );

    const removeConnection = useCallback((connectionId: string) => {
        setConnections((prev) =>
            prev.filter((connection) => connection.id !== connectionId)
        );
    }, []);

    return (
        <dataSourceContext.Provider
            value={{
                registry: registryRef.current,
                connections,
                addConnection,
                removeConnection,
            }}
        >
            {children}
        </dataSourceContext.Provider>
    );
};
