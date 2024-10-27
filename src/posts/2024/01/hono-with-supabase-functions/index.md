---
title: 'Hono with Supabase Edge Functions'
date: 2024-01-15T00:00:00-07:00
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
  alt: 'Hono logo and supabase logo' # alt text
  caption: '' # display caption under cover
  relative: true # when using page bundles set this to true
  hidden: false # only hide on current single page
---

[Hono](https://hono.dev) is a strongly typed middleware webserver that runs on
all modern JS runtimes.

[Supabase](https://supabase.com/) is a backend as a service. They offer a
database, autogenerate REST API, Auth, edge functions and more.

## Why Supabase?

I was looking for a way to speed up the development of my prototype ideas while
still being able to learn new technologies like PostgreSQL, Deno, TypeScript. I
also considered Firebase, and AWS Amplify but the open source nature of Supabase
and the fact it used Postgres as a datastore made me interested. Also I'm a big
fan of Deno so was eager to give it a shot.

## Why Hono with Supabase?

Supabase edge functions run using Deno, so I was considering a few options for
web servers.

- [Oak](https://oakserver.github.io/oak/) the Deno middleware framework. Used
  before, felt little clunky and verbose. Documentation could be better.
- Native `Request` `Response` with `Deno.serve`. Get's hard once there are many
  endpoints.
  [example](https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/restful-tasks/index.ts)
- `npm:koa` or `npm:fastify` or even `npm:express`. Did not want to take the
  risk of npm incompatability.

Ended up choosing Hono because they published their package on Deno's third
party modules, which tells me that they are actively trying to support Deno.
Also, the syntax for Hono was extremely simple and minimal, it reminded me a lot
of [Lume](https://lume.land/) the Deno static site generator. The Hono website
and documentation are also really clear and easy to navigate.

## Use case

The main usecase is to move multiple dependent web requests from the client to
the server. For example, updating a record then sending an email. If this were
to be accomplished in the front end client, these would be dependant promises
that run back to back. The issue with doing it on the front end browser is that
all sorts of things can go wrong between the two webrequets. The browser can be
closed before the second action triggers, network issues, etc.

For queries and single action mutations the `SupabaseClient` with row level
security is good enough. Of course, instead of edge functions, this could also
be done with supabase db functions and triggers, but I want to avoid putting
logic into the DB if possible. Code is easier to test.

## How to do this?

1. Custom Hono `SupabaseEnv`
2. Middleware
3. Handler

### Custom Hono `SupabaseEnv`

The `Env` type is a Hono type used for adding runtime bindings and variables to
the context so that each request can have access to this information. I
originally thought this was only for simple data, but objects can also be passed
through as [generics](https://hono.dev/api/hono#generics).

```typescript
type Env = { Bindings: Bindings; Variables: Variables };
```

We want to pass through the `authorization` header from the request so that the
`SupabaseClient` can append it to the request later. Since we know that objects
can be passed through, instead of just passing through the value, we can pass
the client. We choose to use `Variables` instead of `Bindings` because Hono has
a context function `c.set()` which allows for setting variables in a strongly
typed way.

The custom `Env` will look like this.

```typescript
export type SupabaseEnv = {
  Variables: {
    supabase: SupabaseClient;
  };
};
```

To add this to the app, we need to specify it when invoking the constructor.
Notice, I also set the `basePath`, this is requied because
[edge functions cannot be matched to the root path](https://github.com/supabase/supabase/issues/12629#issuecomment-1442842459).

```typescript
import { Hono } from "https://deno.land/x/hono/mod.ts";
const app = new Hono<SupabaseEnv>().basePath("/api");
```

### Middleware

Hono allows you to create custom middleware to add to the request pipeline. We
will create `supabaseAuth` middleware so that we can pass the client into the
context variables for each request to access.

```typescript
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js";
import { MiddlewareHandler } from "https://deno.land/x/hono/types.ts";
import { Database } from "<generated from supabase cli>";

export function supabaseAuth(): MiddlewareHandler<SupabaseEnv> {
  return async (c, next) => {
    const authHeader = c.req.header("authorization");

    if (!authHeader) {
      return new Response("Unauthorized", { status: 403 });
    }

    const client = createClient<Database>(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("ANON_KEY") || "",
      { global: { headers: { Authorization: authHeader } } },
    );

    c.set("supabase", client);
    await next();
  };
}
```

Make sure to create a `.env` file in your `functions` directory. `SUPABASE_URL`
is automatically set by Supabase so don't include it.

```sh
# supabase/functions/.env
ANON_KEY= # get this from local supabase instance with `supabase status`
```

### Handler

Now we can use the `SupabaseClient` inside of our handler functions as if we are
the user on the front-end. The user Bearer token will be taken from the request
and forwarded directly into any `SupabaseClient` requests.

```typescript
app.post("/multiple-calls", async (c) => {
  const { error } = await c.var.supabase // <-- this is strongly typed
    .from("table")
    .update({ name: "new name" });
  
  if (error) { throw error }

  await sendEmail({...});
});
```

It is now possible to call the function with a single webrequest and not worry
about client side anomalies.

```typescript
await supabase.functions.invoke(
  "api/multiple-calls", {
    method: "POST",
    ...
  })
```

## Gotchas

- remember to generate your supabase types
- remember to set a `basePath`
- remember to create your dotenv file

## Sharing types between Hono function and Vite frontend

One thing I was not able to figure out is to use Hono's strongly typed client
between Deno and Node.js. Setting `tsconfig.json` path to the
`supabase/function/api/index.ts` does allow for types to be shared, but once the
types are coming from Deno modules, the appear as `any`.

If Supabase Functions allows for "Bring your own node modules" in the future, or
Vite can be run directly from Deno, then the function types could be shared
directly to a frontend Vite application.

Another idea is to create the Hono app in a node project, and import it into the
Deno project just so that the Vite project can import the types from the node
project.
