---
title: 'How to use the new Temporal API'
date: 2024-01-25T00:00:00-07:00
tags: []
author: 'Hubert Lin'
draft: false
hidemeta: false
comments: true
description: ''
disableHLJS: false # to disable highlightjs
disableShare: false
searchHidden: false
cover:
  image: 'post-cover.png' # image path/url
  alt: '' # alt text
  caption: '' # display caption under cover
  relative: true # when using page bundles set this to true
  hidden: false # only hide on current single page
---

Working with JavaScript `Date` has always been a struggle. Libraries like
[moment (18kB gzipped)](https://bundlephobia.com/package/moment),
[day.js (3kB gzipped)](https://bundlephobia.com/package/dayjs) and
[luxon (23kB gzipped)](https://bundlephobia.com/package/luxon) filled the gap by
giving a more developer friendly API, but they take up more network bandwidth,
add dependencies and increase build times. That's where Temporal comes in.

Browsers have been working hard to implement Temporal with the
[TC39 Stage 3 draft specification](https://tc39.es/proposal-temporal/) so we
hope to see it fairly soon. In the meantime we can test it out with Deno 1.40.0
under the unstable flag `--unstable-temporal` or using the
[polyfill](https://www.npmjs.com/package/@js-temporal/polyfill) for npm.

Temporal fixes a lot of the problems that `Date` had, here's a few examples and
tips to get you started using Temporal.

### Notable changes

- Values follow [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) standards

  ```js
  // Months start at 1 instead of 0
  (new Date("2024-01-01")).getMonth(); // returns 0 (January)
  Temporal.PlainDate.from("2024-01-01").month // returns 1 (January)
  // Weekdays start at 1 instead of 0
  (new Date("2024-01-01")).getDay(); // returns 0 (Monday)
  Temporal.PlainDate.from("2024-01-01").dayOfWeek; // returns 1 (Monday)
  ```

- Dates can be created independent of timezone (no need for `.split("T")[0]`)

  ```js
  new Date(); // 2024-01-01T07:00:00.000Z (I'm in Mountain Standard Time)
  Temporal.Now.instant(); // similar to `new Date()`
  Temporal.Now.plainDateISO(); // 2024-01-01
  Temporal.Now.plainDate(calendar); // let's you specify a calendar
  ```

- Time can exist without a date `Temporal.PlainTime`
- Time span has a dedicated object
  [`Temporal.Duration`](https://tc39.es/proposal-temporal/docs/duration.html),
  with built in calculations and ability to cast the unit by rounding to a unit
  of choice e.g. years, days, seconds, nanoseconds.
- Supports daylight savings time arithmetic (those bugs are the worst)
- Powerful options for parsing to machine readable strings with `toString()`,
  and human readable strings `.toLocaleString()`

  ```js
  Temporal.Now.instant().toLocaleString("en-US", {
    calendar: "gregory",
    era: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  ```

- Immutable values, so mutations will return new instances

  ```js
  // adding time (you can go back in time with negatives or `.subtract()`)
  const now = Temporal.Now.zonedDateTimeISO();
  const newInstant = now.add({ years: 20, months: 4, nanoseconds: 500 });

  // or, overwriting the time
  const old = Temporal.Now.plainDateTimeISO();
  const changed = old.with({ minutes: 0, second: 30 });
  ```

### Related Links

- Blog post:
  [Fixing JavaScript Date (Maggie Pint)](https://maggiepint.com/2017/04/09/fixing-javascript-date-getting-started/)
- Blog post:
  [Dates and Times in JavaScript](https://blogs.igalia.com/compilers/2020/06/23/dates-and-times-in-javascript/)
- [tc39 proposal](https://github.com/tc39/proposal-temporal)
- [proposal documentation](https://tc39.es/proposal-temporal/docs/)
- Chromium progress https://chromestatus.com/feature/5668291307634688
- Mozilla Firefox progress https://bugzilla.mozilla.org/show_bug.cgi?id=1839673
- Safari Webkit progress https://bugs.webkit.org/show_bug.cgi?id=223166
- Browser public support https://caniuse.com/temporal
- MDN documentation authoring
  https://github.com/tc39/proposal-temporal/issues/1449
