import { getCollection, type CollectionEntry } from 'astro:content';
import { urlLang } from './i18n';
import type { Language } from './taxonomy';

export type Post = CollectionEntry<'labs'>;

export interface PostGroup {
  slug: string;
  variants: Post[];
}

const forbiddenPatterns: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /HTB\{[^}\n]*\}/i, reason: 'looks like an HTB flag (HTB{...})' },
  { pattern: /(user|root)\.txt[^\n]{0,80}\b[a-f0-9]{32}\b/i, reason: 'looks like a user.txt/root.txt flag value' },
];

export function postSlug(post: Post): string {
  const parts = (post.filePath ?? post.id).split(/[\\/]/);
  return parts[parts.length - 2];
}

export function postUrl(post: Post): string {
  return `/labs/${urlLang[post.data.lang]}/${postSlug(post)}/`;
}

function assertPublishable(post: Post): void {
  const fileName = (post.filePath ?? '').split(/[\\/]/).pop();
  if (fileName && fileName !== `${post.data.lang}.md`) {
    throw new Error(`${post.filePath}: frontmatter lang "${post.data.lang}" does not match the file name`);
  }
  const text = `${post.body ?? ''}\n${JSON.stringify(post.data)}`;
  for (const { pattern, reason } of forbiddenPatterns) {
    if (pattern.test(text)) throw new Error(`${post.filePath}: blocked from publishing, ${reason}`);
  }
}

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('labs', (post) => !post.data.draft);
  posts.forEach(assertPublishable);
  return posts.sort((a, b) => b.data.publishedOn.getTime() - a.data.publishedOn.getTime());
}

export async function getPostGroups(): Promise<PostGroup[]> {
  const groups = new Map<string, Post[]>();
  for (const post of await getPosts()) {
    const slug = postSlug(post);
    groups.set(slug, [...(groups.get(slug) ?? []), post]);
  }
  return [...groups].map(([slug, variants]) => ({ slug, variants }));
}

export function findTranslation(posts: Post[], post: Post): Post | undefined {
  return posts.find((other) => postSlug(other) === postSlug(post) && other.data.lang !== post.data.lang);
}

export function otherLanguage(lang: Language): Language {
  return lang === 'en' ? 'pt-BR' : 'en';
}
