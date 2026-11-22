import { copyFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';

const landingFiles = ['index.html', 'styles.css', 'main.js', 'favicon.svg'];

function landingPassthrough() {
  return {
    name: 'landing-passthrough',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        for (const file of landingFiles) {
          await copyFile(new URL(file, import.meta.url), new URL(file, dir));
        }
        logger.info(`copied landing files unchanged: ${landingFiles.join(', ')}`);
      },
    },
  };
}

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://delfino-security-site.vercel.app',
  output: 'static',
  trailingSlash: 'always',
  integrations: [landingPassthrough()],
  markdown: {
    shikiConfig: { theme: 'css-variables' },
  },
});
