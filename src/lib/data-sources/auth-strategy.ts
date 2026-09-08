import { z } from 'zod';

// Discriminated union of auth strategies a data-source connector can use.
// Only 'none' is exercised by the v1 local-file connector; 'sasToken' and
// 'azureAd' exist now so the future Azure Data Lake / Delta connector is
// additive (new connector + reuse of these variants), not a breaking change
// to this type.
export type AuthStrategy =
    | { kind: 'none' }
    | { kind: 'sasToken'; token: string }
    | {
          kind: 'azureAd';
          tenantId: string;
          clientId: string;
          // Populated once the user completes the MSAL login flow; absent
          // until then so the strategy's shape can exist before auth does.
          accessToken?: string;
          scopes: string[];
      };

export const authStrategySchema: z.ZodType<AuthStrategy> = z.discriminatedUnion(
    'kind',
    [
        z.object({ kind: z.literal('none') }),
        z.object({
            kind: z.literal('sasToken'),
            token: z.string().min(1),
        }),
        z.object({
            kind: z.literal('azureAd'),
            tenantId: z.string().min(1),
            clientId: z.string().min(1),
            accessToken: z.string().optional(),
            scopes: z.array(z.string()),
        }),
    ]
);
