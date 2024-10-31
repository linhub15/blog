---
title: "Hosting Angular app on Cloud Cannon"
date: 2018-07-14T00:00:00-07:00
tags:
author: "Hubert Lin"
draft: false
hidemeta: false
comments: false
description: ""
disableHLJS: false # to disable highlightjs
disableShare: false
searchHidden: true
cover:
  image: "" # image path/url
  alt: "<alt text>" # alt text
  caption: "<text>" # display caption under cover
  relative: false # when using page bundles set this to true
  hidden: true # only hide on current single page
---

I've been using Cloud Cannon Hosting for Jekyll static generated websites for a
few months now. When I finally started learning about Angular it seemed like
both would play well since they are both served from static resources. I was
wrong.

As it turns out, Angular apps are meant for "Single Page Applications" so they
are literally one page. The index.html page. So when I try to use Angular Router
and go to www.example.com/ComponentPage I get a 404 resource not found.

The Cloud Cannon servers are taking the browser request literally and trying to
find that resource on the server, but since it's an Angular app, there really
isn't anything there. So what options do I have?

I could use the hashtag routing, but the Angular docs consider that old-school
and strongly recommend sticking the the HTML5 URLs for cleaner easier to read
URLs. I even considered messaging Cloud Cannon to ask if they could add a
feature to redirect all 404 errors to the index.html page. But…

After looking around at the Angular documentation at the very bottom of the
deployment page there is a section about deploying to Github Pages. To my
surprise I found the solution!

## The Solution

Create a 404.html page and copy the contents of index.html into that page. Cloud
Cannon servers will automatically direct the 404 errors to the 404.html page
which will naturally trigger the Angular Routing Module.

1. Create an empty 404.html page in /src/ directory
2. Add "404.html" to the "projects/[your-app]/architect/build/options/assets"
   array found in the src/angular.json file
3. `ng build --prod`
4. Copy the contents of the /dist/index.html into /dist/404.html
5. `git commit` / `git push`

The most important step is to make sure that the 404.html contents match
index.html exactly. Since each ng-build changes the file hashes and references
in index.html this must be done to ensure routing works.

## For now…

This isn't the best solution, but for now I'm really happy with Cloud Cannon
Hosting. It would be nice to have a way to use the amazing features of Angular
and somehow merge it with Jekyll static sites.
