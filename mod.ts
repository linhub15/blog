import plugins, { type Options } from "./plugins.ts";

export type { Options } from "./plugins.ts";

export default function (options: Partial<Options> = {}) {
  return (site: Lume.Site) => {
    // Configure the site
    site.use(plugins(options));

    // Add remote files
    const files = [
      "_includes/css/fonts.css",
      "_includes/css/page.css",
      "_includes/css/post-list.css",
      "_includes/css/post.css",
      "_includes/css/reset.css",
      "_includes/css/badge.css",
      "_includes/css/variables.css",
      "_includes/css/search.css",
      "_includes/layouts/base.vto",
      "_includes/layouts/page.vto",
      "_includes/layouts/post.vto",
      "_includes/layouts/posts.vto",
      "_includes/layouts/posts_result.vto",
      "_includes/templates/post-details.vto",
      "_includes/templates/post-list.vto",
      "posts/_data.yml",
      "_data.yml",
      "_data/i18n.yml",
      "404.md",
      "posts_result.page.js",
      "posts.page.js",
      "index.vto",
      "styles.css",
      "favicon.ico",
    ];

    for (const file of files) {
      site.remoteFile(file, import.meta.resolve(`./src/${file}`));
    }
  };
}
