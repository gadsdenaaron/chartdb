import { describe, expect, it } from 'vitest';
import { createDataSourceRegistry } from '../connector-registry';
import type { DataSourceConnector } from '../data-source-connector';

const makeConnector = (
    kind: 'localFile' | 'azureDelta',
    marker: string
): DataSourceConnector => ({
    kind,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configSchema: { marker } as any,
    registerSource: async () => undefined,
});

describe('createDataSourceRegistry', () => {
    it('returns undefined for a kind that was never registered', () => {
        const registry = createDataSourceRegistry();
        expect(registry.get('localFile')).toBeUndefined();
    });

    it('registers and retrieves a connector by kind', () => {
        const registry = createDataSourceRegistry();
        const connector = makeConnector('localFile', 'first');

        registry.register(connector);

        expect(registry.get('localFile')).toBe(connector);
    });

    it('replaces a previously registered connector for the same kind', () => {
        const registry = createDataSourceRegistry();
        const first = makeConnector('localFile', 'first');
        const second = makeConnector('localFile', 'second');

        registry.register(first);
        registry.register(second);

        expect(registry.get('localFile')).toBe(second);
        expect(registry.list()).toHaveLength(1);
    });

    it('lists all registered connectors across kinds', () => {
        const registry = createDataSourceRegistry();
        const localFile = makeConnector('localFile', 'a');
        const azureDelta = makeConnector('azureDelta', 'b');

        registry.register(localFile);
        registry.register(azureDelta);

        expect(registry.list()).toHaveLength(2);
        expect(registry.list()).toEqual(
            expect.arrayContaining([localFile, azureDelta])
        );
    });
});
