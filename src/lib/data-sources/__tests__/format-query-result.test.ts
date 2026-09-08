import { describe, expect, it } from 'vitest';
import {
    arrowResultToQueryResult,
    formatCell,
    type ArrowResultLike,
} from '../format-query-result';

describe('formatCell', () => {
    it('formats null and undefined as NULL', () => {
        expect(formatCell(null)).toBe('NULL');
        expect(formatCell(undefined)).toBe('NULL');
    });

    it('formats bigint values as plain decimal strings', () => {
        expect(formatCell(42n)).toBe('42');
    });

    it('formats Date values as ISO strings', () => {
        const date = new Date('2026-01-01T00:00:00.000Z');
        expect(formatCell(date)).toBe('2026-01-01T00:00:00.000Z');
    });

    it('formats plain objects as JSON, converting nested bigints', () => {
        expect(formatCell({ count: 5n })).toBe('{"count":"5"}');
    });

    it('formats primitives via String()', () => {
        expect(formatCell(42)).toBe('42');
        expect(formatCell('hello')).toBe('hello');
        expect(formatCell(true)).toBe('true');
    });
});

describe('arrowResultToQueryResult', () => {
    const buildResult = (): ArrowResultLike => ({
        schema: {
            fields: [
                { name: 'id', type: { toString: () => 'INTEGER' } },
                { name: 'name', type: { toString: () => 'VARCHAR' } },
            ],
        },
        toArray: () => [
            { id: 1, name: 'a', toJSON: () => ({ id: 1, name: 'a' }) },
            { id: 2, name: 'b', toJSON: () => ({ id: 2, name: 'b' }) },
        ],
    });

    it('maps schema fields to columns with name and type', () => {
        const result = arrowResultToQueryResult(buildResult(), 12.3);

        expect(result.columns).toEqual([
            { name: 'id', type: 'INTEGER' },
            { name: 'name', type: 'VARCHAR' },
        ]);
    });

    it('converts rows via toJSON() when available', () => {
        const result = arrowResultToQueryResult(buildResult(), 0);

        expect(result.rows).toEqual([
            { id: 1, name: 'a' },
            { id: 2, name: 'b' },
        ]);
        expect(result.rowCount).toBe(2);
    });

    it('falls back to the raw row object when toJSON is absent', () => {
        const result = arrowResultToQueryResult(
            {
                schema: {
                    fields: [
                        { name: 'x', type: { toString: () => 'INTEGER' } },
                    ],
                },
                toArray: () => [{ x: 1 }, { x: 2 }],
            },
            0
        );

        expect(result.rows).toEqual([{ x: 1 }, { x: 2 }]);
    });

    it('carries through the provided duration', () => {
        const result = arrowResultToQueryResult(buildResult(), 42);
        expect(result.durationMs).toBe(42);
    });
});
