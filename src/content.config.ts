import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { attackIdPattern } from './lib/attack';
import { findRule } from './lib/rulesIndex';
import { difficulties, htbKinds, languages, operatingSystems, platforms, postTypes } from './lib/taxonomy';

const attackId = z.string().regex(attackIdPattern, 'ATT&CK id like T1190 or T1059.004');

const timelineStep = z.strictObject({
  title: z.string().min(1),
  detail: z.string().optional(),
  attack: z.array(attackId).default([]),
});

const detectionBase = {
  telemetry: z.array(z.string().min(1)).min(1),
  logic: z.string().min(1).optional(),
  logicLanguage: z.string().default('yaml'),
  notes: z.string().optional(),
};

const ruleId = z.string().refine((id) => findRule(id) !== undefined, {
  message: 'rule not found in src/data/rules-index.json (pin a release that contains it)',
});

const labs = defineCollection({
  loader: glob({ pattern: '*/{pt-BR,en}.md', base: './src/content/labs' }),
  schema: ({ image }) =>
    z
      .strictObject({
        title: z.string().min(1),
        summary: z.string().min(1),
        lang: z.enum(languages),
        type: z.enum(postTypes),
        platform: z.enum(platforms),
        platformLabel: z.string().optional(),
        htbKind: z.enum(htbKinds).optional(),
        difficulty: z.enum(difficulties).optional(),
        os: z.enum(operatingSystems).optional(),
        retiredOn: z.coerce.date().optional(),
        eventDate: z.coerce.date().optional(),
        publishedOn: z.coerce.date(),
        updatedOn: z.coerce.date().optional(),
        attack: z.array(attackId).default([]),
        timeline: z.array(timelineStep).default([]),
        detection: z
          .discriminatedUnion('level', [
            z.strictObject({ level: z.literal(1), ...detectionBase, logic: z.string().min(1) }),
            z.strictObject({ level: z.literal(2), ...detectionBase, rule: ruleId }),
            z.strictObject({
              level: z.literal(3),
              ...detectionBase,
              rule: ruleId.optional(),
              screenshot: image(),
              screenshotAlt: z.string().min(1),
              validatedOn: z.coerce.date(),
              lab: z.string().min(1),
            }),
          ])
          .optional(),
        example: z.boolean().default(false),
        draft: z.boolean().default(false),
      })
      .superRefine((post, ctx) => {
        const issue = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
        if (post.platform === 'htb') {
          if (!post.htbKind) issue('htbKind', 'required for Hack The Box content');
          if (!post.retiredOn) issue('retiredOn', 'Hack The Box content must be retired: set its retirement date');
          else if (post.retiredOn.getTime() > Date.now()) issue('retiredOn', 'retirement date is in the future: active content cannot be published');
          if (post.type === 'sherlock' && post.htbKind && post.htbKind !== 'sherlock') issue('htbKind', 'a sherlock post must use htbKind: sherlock');
        } else {
          if (!post.platformLabel) issue('platformLabel', 'name the CTF or platform');
          if (post.htbKind || post.retiredOn) issue('platform', 'htbKind and retiredOn only apply to platform: htb');
        }
        if (post.type === 'note' && post.timeline.length > 0) issue('timeline', 'notes have no attack timeline');
      }),
});

export const collections = { labs };
