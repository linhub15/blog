---
title: 'Beware of incremental database Ids'
date: 2021-12-21T00:00:00-07:00
tags: ['db', 'lessons-learned']
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
  alt: '<alt text>' # alt text
  caption: '<text>' # display caption under cover
  relative: true # when using page bundles set this to true
  hidden: false # only hide on current single page
---

Back in school when we were learning database fundamentals, we learned about
keywords to build a database table. Known as data definition language. One thing
that stood out to me was the `IDENTITY` column. It allows columns to auto
generate an integer each time a new record is inserted. For Microsoft's
Transact-SQL it looks like this:

```
IDENTITY(0,1)
```

This takes two arguments. The first is the seed, meaning the starting value, and
second is the increment amount. So the first inserted row will have `Id` of 0
and adds 1 for each subsequent insert.

I think this is really convenient. There is no need to specify the `Id` value
when inserting new row items. At the time I couldn't see any cases where this
would be bad, but now I have learned of some costs to this convenience. There
are some real world situations where using auto-generated incremental primary
keys are not such a good idea.

## Danger #1

It becomes a challenge to insert new data when `IDENTITY` columns need to be
managed between environments or databases.

Here's the problem. Each developer has a DEV environment with the same `Id`
values from the PROD branch. When two developers insert different new data, the
`Id` values that are generated will be same. We don't know which feature will be
finished first so it's a race to production.

Let's see a concrete example. Given a table of `VehicleType`.

```md
# dbo.VehicleType

| Id | Description |
| -- | ----------- |
| 0  | car         |
| 1  | boat        |
```

In the DEV environment, both developers have this table. When one developer adds
a new vehicle: `plane`, the new `Id` is 2. When another developer adds the
vehicle `motorcycle` the new `Id` generated is also 2. The `Id` values are the
same, but with different data. They can't both be 2 in production so the data
that goes to PROD first will claim the `Id`. This makes development less
flexible because we don't know which developer will finish their feature and go
to PROD first. Things happen, and some features need to be delayed and their
releases postponed.

What makes this even worse is when the `VehicleType.Id` is in hard-coded into
the code base. You probably know what I mean. There's always that Enum, Types,
or Constants or similarly suffixed file somewhere to be found in an enterprise
application(there's got to be a better way, maybe a future post on that). If you
lose the race to PROD, you have to change your code and test again.

```csharp
// VehicleTypes.cs
public enum VehicleTypes
{
    Car,
    Boat,
    Plane // or Motorcyle
}
```

This requires coordination, increases the risk of mistakes, and will cost the
project more money when making changes. You now have to involve DBA and other
developers to make sure you aren't stepping on each others' toes. Hopefully you
aren't in separate teams, and hopefully those separate teams aren't in separate
companies developing or maintaining that app at the same time.

## Danger #2

It is possible to enumerate and scrape APIs, because `IDENTITY` are incremental
and predictable.

```
https://api.cool-machines.com/vehicles/1
```

Do you see the number `1` at the end? Anyone can try a different number and see
if they can get another result. When exposing data in an web API, you probably
don't want to expose the `IDENTITY` in the URL.

This is similar to what happened to Gravatar's recent
[breach](https://www.bleepingcomputer.com/news/security/online-avatar-service-gravatar-allows-mass-collection-of-user-info/).
Being able to enumerate your data, even if it's public can be considered a
breach.

## Solution

Use `UUID` by default. `UUID` or `GUID` are unique string of alpha-numeric
characters that are randomly generated. This protects from both dangers because
you can't guess the next number and you can't accidentally generate a the same
one. This will allow developers to insert `Plane` and `Motorcycle` in any order
without worrying about clashing in the database.

In the DB switch the column type to `uniqueidentifier` or `varchar(36)`. In the
C# code, we can't just use `GUID` as `enum` so we have to switch the `enum` into
a `class` like this:

```csharp
// VehicleTypes.cs
public static class VehicleTypes
{
    public const Guid Car = new Guid("...");
    public const Guid Boat = new Guid("...");

   // add in any order, git can merge this easy
   public const Guid Plane = new Guid("...");
   public const Guid Motorcycle = new Guid("...");
}
```

This also fixes the enumeration and scraping issue. You could even expose the
UUID in the URL if you want. People could try to plop UUIDs at the end of the
URL but the collision probability is so low that it's not worth the time.

API Urls will now look like this:

```
https://api.cool-machines.com/vehicles/bdc8971c-7d8d-476f-9a4b-4c45d1fb7ea2
```

## Conclusion

I think it's safe to avoid using `IDENTITY` columns and use `UUID` by default. I
have yet to come across a use-case where the benefits of `IDENTITY` are better
than `UUID` but will keep my mind open. The one downside of using `UUID` is
typing them out when debugging. Please let me know if you have a different
opinion because I could be completely wrong here.

Thanks for reading!

### Disclaimer

In my examples above, the dangers exist because of a multiple factors. It is not
that `IDENTITY` should not be used, but in order to accomodate the certain
development lifecycles, I have witnessed some real world inconveniences. As for
enumeration vulnerabilities, it is not exclusive to `IDENTITY` columns. With the
proper security, it's fine to expose sequential numeric `Id` values. Designing
Web API endpoints requires careful consideration on who will be consuming it.
