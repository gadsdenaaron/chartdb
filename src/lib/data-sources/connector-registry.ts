import type {
    DataSourceConnectionInfo,
    DataSourceConnector,
    DataSourceKind,
} from './data-source-connector';

export interface DataSourceRegistry {
    // Registering a connector for a kind that's already registered replaces
    // the previous one — later registration wins, matching how the provider
    // re-registers built-in connectors idempotently on remount.
    //
    // Accepts any DataSourceConnector<TConfig>, so connector authors (e.g.
    // local-file-connector.ts) keep full type safety on their own config
    // shape. Internally the registry erases TConfig to the base
    // DataSourceConnectionInfo, since a heterogeneous registry can't
    // otherwise be typed — callers look a connector up by `kind` and are
    // expected to construct the matching concrete config before calling
    // registerSource, exactly like the sql-console-section.tsx usage does.
    register: <TConfig extends DataSourceConnectionInfo>(
        connector: DataSourceConnector<TConfig>
    ) => void;
    get: (kind: DataSourceKind) => DataSourceConnector | undefined;
    list: () => DataSourceConnector[];
}

export const createDataSourceRegistry = (): DataSourceRegistry => {
    const connectors = new Map<DataSourceKind, DataSourceConnector>();

    return {
        register: (connector) => {
            connectors.set(
                connector.kind,
                connector as unknown as DataSourceConnector
            );
        },
        get: (kind) => connectors.get(kind),
        list: () => Array.from(connectors.values()),
    };
};
