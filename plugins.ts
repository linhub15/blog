import date, { type Options as DateOptions } from "lume/plugins/date.ts";
import tailwindcss from "lume/plugins/tailwindcss.ts";
import typography from "npm:@tailwindcss/typography";
import postcss from "lume/plugins/postcss.ts";
import terser from "lume/plugins/terser.ts";
import prism, { type Options as PrismOptions } from "lume/plugins/prism.ts";
import basePath from "lume/plugins/base_path.ts";
import slugifyUrls from "lume/plugins/slugify_urls.ts";
import resolveUrls from "lume/plugins/resolve_urls.ts";
import metas from "lume/plugins/metas.ts";
import pagefind, {
  type Options as PagefindOptions,
} from "lume/plugins/pagefind.ts";
import sitemap from "lume/plugins/sitemap.ts";
import readingInfo from "lume/plugins/reading_info.ts";
import { merge } from "lume/core/utils/object.ts";
import image from "https://deno.land/x/lume_markdown_plugins@v0.7.1/image.ts";
import footnotes from "https://deno.land/x/lume_markdown_plugins@v0.7.1/footnotes.ts";
import { alert } from "npm:@mdit/plugin-alert@0.13.1";

export interface Options {
  prism?: Partial<PrismOptions>;
  date?: Partial<DateOptions>;
  pagefind?: Partial<PagefindOptions>;
}

export const defaults: Options = {};

/** Configure the site */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    site
      .use(
        tailwindcss({
          extensions: [".html", ".vto"],
          options: {
            plugins: [typography],
            darkMode: "selector",
          },
        }),
      )
      .use(postcss())
      .use(basePath())
      .use(prism(options.prism))
      .use(readingInfo())
      .use(date(options.date))
      .use(metas())
      .use(image())
      .use(footnotes())
      .use(resolveUrls())
      .use(slugifyUrls())
      .use(terser())
      .use(pagefind(options.pagefind))
      .use(sitemap())
      .copy([".jpg", ".jpeg", ".png", ".svg", ".webp", ".ico"])
      .mergeKey("extra_head", "stringArray")
      .preprocess([".md"], (pages) => {
        for (const page of pages) {
          page.data.excerpt ??= (page.data.content as string).split(
            /<!--\s*more\s*-->/i,
          )[0];
        }
      });

    // Alert plugin
    site.hooks.addMarkdownItPlugin(alert);
  };
}
