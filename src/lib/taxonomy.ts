export const languages = ['pt-BR', 'en'] as const;
export const postTypes = ['writeup', 'sherlock', 'note'] as const;
export const platforms = ['htb', 'ctf', 'other'] as const;
export const htbKinds = ['machine', 'challenge', 'sherlock', 'starting-point', 'academy-tier0', 'mini-pro-lab'] as const;
export const difficulties = ['very-easy', 'easy', 'medium', 'hard', 'insane'] as const;
export const operatingSystems = ['linux', 'windows', 'freebsd', 'other'] as const;
export const evidenceLevels = [1, 2, 3] as const;

export type Language = (typeof languages)[number];
export type PostType = (typeof postTypes)[number];
export type Platform = (typeof platforms)[number];
export type EvidenceLevel = (typeof evidenceLevels)[number];
