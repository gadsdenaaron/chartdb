import { describe, expect, it } from 'vitest';
import { authStrategySchema } from '../auth-strategy';

describe('authStrategySchema', () => {
    it('accepts a none strategy', () => {
        expect(authStrategySchema.safeParse({ kind: 'none' }).success).toBe(
            true
        );
    });

    it('accepts a valid sasToken strategy', () => {
        expect(
            authStrategySchema.safeParse({
                kind: 'sasToken',
                token: 'sv=2024',
            }).success
        ).toBe(true);
    });

    it('rejects a sasToken strategy with an empty token', () => {
        expect(
            authStrategySchema.safeParse({ kind: 'sasToken', token: '' })
                .success
        ).toBe(false);
    });

    it('accepts a valid azureAd strategy without an access token yet', () => {
        expect(
            authStrategySchema.safeParse({
                kind: 'azureAd',
                tenantId: 'tenant-1',
                clientId: 'client-1',
                scopes: ['https://storage.azure.com/.default'],
            }).success
        ).toBe(true);
    });

    it('rejects an azureAd strategy missing clientId', () => {
        const result = authStrategySchema.safeParse({
            kind: 'azureAd',
            tenantId: 'tenant-1',
            scopes: [],
        });

        expect(result.success).toBe(false);
    });

    it('rejects an unknown kind', () => {
        expect(authStrategySchema.safeParse({ kind: 'oauth' }).success).toBe(
            false
        );
    });
});
