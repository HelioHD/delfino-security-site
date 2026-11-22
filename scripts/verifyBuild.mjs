import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

const landingFiles = ['index.html', 'styles.css', 'main.js', 'favicon.svg'];
const failures = [];

const sha256 = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');

for (const file of landingFiles) {
  const [source, built] = await Promise.all([sha256(file), sha256(`dist/${file}`)]);
  console.log(`${source === built ? 'ok  ' : 'FAIL'} landing ${file} ${source}`);
  if (source !== built) failures.push(`dist/${file} differs from ${file}`);
}

const feed = await readFile('dist/labs/rss.xml', 'utf8');
const validation = XMLValidator.validate(feed);
if (validation !== true) failures.push(`rss.xml is not well-formed: ${JSON.stringify(validation.err)}`);
const channel = new XMLParser({ ignoreAttributes: false }).parse(feed).rss?.channel;
const items = [channel?.item ?? []].flat();
if (!channel?.title || !channel?.link || items.length === 0) failures.push('rss.xml is missing channel title, link or items');
for (const item of items) {
  if (!item.title || !item.link || !item.pubDate || !item.guid) failures.push(`rss item incomplete: ${item.title}`);
  const path = new URL(item.link).pathname;
  const file = `dist${path}index.html`;
  await readFile(file).catch(() => failures.push(`rss item points to a missing page: ${path}`));
}
console.log(`${validation === true ? 'ok  ' : 'FAIL'} rss.xml well-formed, ${items.length} items`);

const builtPages = (await readdir('dist/labs', { recursive: true })).filter((name) => name.endsWith('index.html'));
console.log(`ok   ${builtPages.length} labs pages built`);

if (failures.length > 0) {
  console.error(failures.map((failure) => `FAIL ${failure}`).join('\n'));
  process.exit(1);
}
