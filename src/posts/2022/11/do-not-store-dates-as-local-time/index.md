---
title: 'Do not store dates as local time'
date: 2022-11-30T00:00:00-07:00
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
  image: 'imgs/post-cover.png' # image path/url
  alt: '' # alt text
  caption: '' # display caption under cover
  relative: true # when using page bundles set this to true
  hidden: false # only hide on current single page
---

Alberta's winter is known to have short hours of sunlight while summers are
known to have long bright sunny days. So, I guess someone wanted to save what
little sunlight we had in winter and proposed Daylight Savings Time (DST).

Daylight Savings Time starts every year in March and ends in November. For the
months in DST, we use `GMT-6` Mountain Daylight Time, and outside DST we use
`GMT-7` Mountain Standard Time. In short Daylight Savings Time is between the
second Sunday of March at `2:00 AM GMT-7` to the first Sunday of November at
`2:00 AM GMT-6`.

Now let's take a look at why storing local date times is a bad idea.

Given a system that stores local date times without without the timezone offset.
It is possible to have duplicate representations of independent moments in time.

This sounds confusing, let me explain.

When DST begins at `2:00 AM GMT-7` we lose the hour between 2:00 and 3:00 AM.
The moment the clock changes to `2:00 GMT-7`, we switch time zones and
immediately show it as `3:00 GMT-6`.

```text
                  ++++
GMT   7:00  8:00  9:00  10:00
GMT-6 1:00  2:00  3:00  4:00
GMT-7 0:00  1:00  2:00  3:00
                  ^^^^
                  here: we switch from GMT-7 to GMT-6
```

This means that the database will never store any time between 2:00 and 2:59
inclusive. But wait, this isn't the real problem with storing local times.
Although we don't see 2:15 in the database, it is still represented by 3:15,
we're not missing any data.

The true problem comes when DST is switched back. Notice when we switch, we are
trying to represent 2:00, but the moment we reach 2:00 we show 1:00 again.

```text
            ++++
GMT   7:00  8:00  9:00
GMT-6 1:00  2:00  3:00
GMT-7 0:00  1:00  2:00
            ^^^^
            here: we switch from GMT-6 to GMT-7
```

Do you see the problem? We have already stored 1:00 AM in the database. We can
no longer know the difference between any times between 1:00 and 2:00. They
could be either GMT-6 or GMT-7, and we have no way to distinguish them with just
this field alone. I'm sure you can image this causing some odd queries when
sorting, or filtering.

## So how can this be prevented?

There are a few ways. The first is to always store date times as UTC time or
timestamp from epoch. The other is to store the offset along with the local date
time. There are pros and cons to each so you'll need to find out which suits
your use case.

1. Store them as UTC `2022-03-13T08:00:00.000Z` even when time zone switches,
   the hour continues to increase.
2. Store them with timezone `2022-03-13T02:00:00.000-06:00` we can differentiate
   duplicate times with the offset.

Technology is moving towards cloud servers and remote work so time will become
an increasingly important architectural consideration. Do not naively assume
that because the application is internal and region locked that you can get away
with storing local times.

### Question

What is the expected time zone when filtering on the client (browser)?

If a user tries to find all date times between 1:00 AM and 2:00 AM but their
current time zone is GMT-7. Do you use the user time zone of GMT-7, or the time
zone of the date time that is being filtered which could be either?

Here's a concrete example.

August 1, 2022, is DST so the time zone is GMT-6 Today happens to be December 1,
2022, so the time zone is GMT-7 The user wants to filter times between 1:00 AM
and 2:00 AM for August 1. Since the database stores the time in UTC, we would be
fetching times between `T06:00Z, T07:00Z` or `T07:00Z, T08:00Z`. Which one
should the filter return?

Let me know what you think.
