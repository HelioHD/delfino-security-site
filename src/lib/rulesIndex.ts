import { z } from 'astro/zod';
import rawIndex from '../data/rules-index.json';

const attackId = z.string().regex(/^T\d{4}(\.\d{3})?$/);

const ruleSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9_]+(\/[a-z0-9_]+)+$/),
  title: z.string().min(1),
  format: z.enum(['sigma', 'yara']),
  path: z.string().min(1),
  url: z.url({ protocol: /^https$/ }),
  attack: z.array(attackId),
  status: z.enum(['stable', 'test', 'experimental']),
  tests: z.strictObject({ positive: z.int().min(1), negative: z.int().min(1) }),
  ci: z.literal('passing'),
});

const rulesIndexSchema = z.strictObject({
  $schema: z.string().optional(),
  schemaVersion: z.literal(1),
  repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  release: z.string().regex(/^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/),
  commit: z.string().regex(/^[0-9a-f]{40}$/),
  generatedAt: z.iso.datetime({ offset: true }),
  sample: z.boolean(),
  rules: z.array(ruleSchema),
});

export type DetectionRule = z.infer<typeof ruleSchema>;

export const rulesIndex = rulesIndexSchema.parse(rawIndex);

const rulesById = new Map(rulesIndex.rules.map((rule) => [rule.id, rule]));

export function findRule(id: string): DetectionRule | undefined {
  return rulesById.get(id);
}
