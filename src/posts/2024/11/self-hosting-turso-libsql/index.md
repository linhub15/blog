---
title: 'Self-hosting Turso libSQL'
date: 2024-11-06T00:00:00-07:00
tags: ['guide']
author: 'Hubert Lin'
draft: false
hidemeta: false
comments: true
description: ''
cover:
  image: ''
---

[Turso](https://turso.tech) offers a SQLite like database called
[libSQL](https://docs.turso.tech/libsql) as an alternative to conventional dbs
like PostgreSQL and MySQL. I was curious, so I tried hosting it on an Ubuntu
VPS. I used [Coolify](https://coolify.io/) and [Deno](https://deno.com/) for
generating the JWT to secure the server.

## What is libSQL?

`libSQL` is an open-source fork of sqlite. It's super fast, lightweight, and
pretty simple to self host.

The syntax and usage feels the same as sqlite but it is accessible over HTTP and
websockets. It's even possible to target the sqlite file directly, so it's
perfect for integration testing in CI pipelines for speed.

```javascript
// Example targetting an sqlite file named `local.db`
import { createClient } from "npm:@libsql/client";
const client = createClient({
  url: "file:local.db",
});
```

## Self-hosting Turso

Turso created a server mode for libSQL called `sqld` which we'll be using on a
VPS (Virtual Private Server).

There are a few
[options for self hosting `sqld`](https://github.com/tursodatabase/libsql/blob/25c5f8e4bd1cf2793b0a0754b034f26ad27506e5/docs/BUILD-RUN.md),
but I'll be using the prebuilt Docker image method. You can run the docker image
manually or use a self-hosting tool like Coolify.

### Manual Docker

To start with Ubuntu VPS and docker:

1. Run the docker image

```
docker run -p 8080:8080 -d ghcr.io/tursodatabase/libsql-server:latest
```

2. Now test the connection. Make sure to specify the VPS ip address and port
   (defaults to 8080).

```javascript
// Save this to `test.ts` and run it `deno run -A test.ts`
import { createClient } from "npm:@libsql/client";
const client = createClient({ url: "http://x.x.x.x:8080" });
const result = await client.execute("select 1;");
console.log(result);
```

3. (Optional) setup domain name, reverse proxy, automatic restarts, persistance
   etc. Coolify makes this easier.

### Coolify

Coolify helps by managing the docker image, reverse proxy, health checks, and
more. If you want to setup coolify check out their
[docs](https://coolify.io/docs/).

1. We'll start with creating a new "Resource".
   - select "Docker Image" with `ghcr.io/tursodatabase/libsql-server:latest`
2. Next we need to configure the exposed port
   - find `General -> Network -> Ports Exposes` and set it to `8080`
3. (Optionally) Set a custom domain.
4. Save the changes and deploy.

Now let's test the connection. Remember to replace the url.

```javascript
import { createClient } from "npm:@libsql/client";
const client = createClient({ url: "http://x.x.x.x:8080" });
const result = await client.execute("select 1;");
console.log(result);
```

If the setup works, you'll see the data.

```javascript
ResultSetImpl {
  columns: [ "1" ],
  columnTypes: [ "" ],
  rows: [ { "1": 1 } ],
  rowsAffected: 0,
  lastInsertRowid: undefined
}
```

#### Persist the DB file in Coolify

To persist the db between restarts and redeployment, create a volume for the
resource.

`Source path` is the path on the host server, so set this based on your own
convention.

`Destination Path` is the path in the docker container. By default, `sqld`
stores the sqlite file at `/var/lib/sqld/iku.db` so I set it to `/var/lib/sqld`.

### Add authentication to secure the db server

The server is currently public and anyone can read and write to the DB.
Thankfully Turso has provided a way to secure the server.

To do this, `sqld` uses a public/private key pattern. The public key is
configured on the server while the private key is used to sign a JWT for the
client.

Use the public key in the server environment variable `SQLD_AUTH_JWT_KEY_FILE`.

The public key can be either of these formats, I'll be using the second one.

- PKCS#8-encoded Ed25519 PEM
- plain bytes of a Ed25518 public key in URL-safe base64 format

Next, let's talk about the private key. The private key is used to sign a JWT
with the access permission payload. I want read and write permissions so I'll
specify `rw` (`ro` for read-only).

Here's a Deno script to generate the public/private keypair. To run this, save
this into a file `gen.ts` and run it with `deno run -A gen.ts`.

```javascript
import * as jose from "npm:jose";

const access = "rw"; // or "ro";

const keyPair = await crypto.subtle.generateKey(
  {
    name: "Ed25519",
    namedCurve: "Ed25519",
  },
  true,
  ["sign", "verify"],
);

const rawPublicKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);

const urlSafeBase64PublicKey = btoa(
  String.fromCharCode(...new Uint8Array(rawPublicKey)),
)
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

console.log("Public Key\n", urlSafeBase64PublicKey);

const jwt = await (new jose.SignJWT({ "a": access }))
  .setProtectedHeader({ alg: "EdDSA", "typ": "JWT" })
  .setIssuedAt()
  .sign(keyPair.privateKey);

console.log("JWT\n", jwt);
```

This will output both the public key and JWT in the correct format, ready to be
used.

```
Public Key
 1-suDZGtkYOoxoiVHmQHCBJ-REZq94Y0Bv_dw52aqtE
JWT
 eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MzA5NTgzMDZ9.lplN4-LrIQxaiiX74MDiQ3UnQgwZQS_Eee8_m0h-BiNiX3fyPZ7FGiMIQux38HXpy4ISjJWcRGWbWPCN3urPAQ
```

Place the public key into your server environment variable
`SQLD_AUTH_JWT_KEY_FILE`, and test your connection to get a
`HttpServerError: Server returned HTTP status 401`.

```javascript
import { createClient } from "npm:@libsql/client";
const client = createClient({ url: "http://x.x.x.x:8080" });
const result = await client.execute("select 1;");
console.log(result);
```

Now add the the JWT and test again. If you see the data, then it worked. The
server is now secured using JWT-based authentication.

```javascript
import { createClient } from "npm:@libsql/client";
const client = createClient({
  url: "http://x.x.x.x:8080",
  authToken:
    "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MzA5NTgzMDZ9.lplN4-LrIQxaiiX74MDiQ3UnQgwZQS_Eee8_m0h-BiNiX3fyPZ7FGiMIQux38HXpy4ISjJWcRGWbWPCN3urPAQ",
});
const result = await client.execute("select 1;");
console.log(result);
```

## Conclusion

I do want to thank Turso for the great documentation, very well written and easy
to follow.

Overall, I enjoyed the learning process for self-hosting libSQL. I'm not too
sure how the dev experience is with testing, migrations or high volumes but will
give it try.
