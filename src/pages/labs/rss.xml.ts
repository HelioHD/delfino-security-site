import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { translate } from '../../lib/i18n';
import { getPosts, postUrl } from '../../lib/posts';

export async function GET(context: APIContext) {
  const site = context.site ?? new URL('https://example.invalid');
  const posts = await getPosts();
  return rss({
    title: translate('en', 'feed.title'),
    description: translate('en', 'index.description'),
    site: new URL('/labs/', site).href,
    trailingSlash: true,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<atom:link href="${new URL('/labs/rss.xml', site).href}" rel="self" type="application/rss+xml"/>`,
    items: posts.map((post) => ({
      title: post.data.title,
      link: new URL(postUrl(post), site).href,
      pubDate: post.data.publishedOn,
      description: post.data.summary,
      categories: [post.data.type, post.data.platform, post.data.lang, ...post.data.attack],
    })),
  });
}
