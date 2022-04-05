---
title: 'Cheap Web Hosting Options'
date: 2022-04-04T00:00:00-07:00
tags: []
author: 'Hubert Lin'
showToc: false
TocOpen: false
draft: false
hidemeta: false
comments: true
description: ''
disableHLJS: false # to disable highlightjs
disableShare: false
searchHidden: false
cover:
  image: '' # image path/url
  alt: '' # alt text
  caption: '' # display caption under cover
  relative: true # when using page bundles set this to true
  hidden: true # only hide on current single page
---

In the last 2 years, I shopped around and found cheap web hosting options for my projects, here's what I found.

What makes a hosting provider good?

For me, it needs to have a good developer experience, decent documentation, security features like 2FA, and maybe Github integration.

I'm excluding cloud providers from this post because in my past experience I found their free tiers and configuration complexity not worth the hassle for smaller projects, but still definitely worth considering.

## Domain Name Registrars

First thing about web hosting is of course the website URL, also known as the domain name. I mainly use [Google domains](https://domains.google.com).

Although pricier, I noticed the DNS records propagate faster compared to other providers. This is, of course, purely anecdotal so I don't actually know if it was faster, maybe the servers were just closer to me geographically. Normally DNS resolution takes 42 to 72 hours to propagate, so that means if you point your domain to the server, it could take that long before people can use your site.

I also like Google Domain's user interface, it's intuitive and simple to use, so that's a plus.

My next best picks with cheaper prices are:

- <https://www.namecheap.com>
- <https://porkbun.com>

## Hosting providers

- Github Pages - <https://pages.github.com> [Free]
- Cloudflare Pages - <https://pages.cloudflare.com> [Free]
- Hostinger Shared Hosting - <https://www.hostinger.com/web-hosting> [~$4/month]
- Ionos VPS - <https://www.ionos.ca/servers/vps> [$1/month]
- Digital Ocean Droplet - <https://www.digitalocean.com/products/droplets> [$5/month]

### Static sites and Single Page applications

#### Github pages

For quick and simple, "get a site up right now" projects I'll use Github pages.
Almost all my projects use Github for version control anyways, so all I do is commit the website artifacts and push. Then go into the settings to turn on Github pages and point to the output directory.

This is the quickest way to show someone your test site and it's free.

One reason I don't use this more is that I don't like committing build artifacts into version control, so I'll only do this if I need something up really quick.

#### Cloudflare pages

You've probably seen Cloudflare DDOS protection on various websites, but did you know about their free static site hosting?

It was still in Beta when I first tried it out but if you're looking to just host HTML, CSS, and JavaScript files, Cloudflare Pages is very convenient. It links directly with your Github repository for easy build and deploy, and even builds and serves other branches so you can test out your changes before merging into production.

Cloudflare pages supports various frameworks for building sites and apps. I use it for Hugo generated static sites, and single page application frameworks like Angular.

The one thing to keep an eye out with Cloudflare is the pricing plans and vendor lock-in. The convenience does come at a cost. I wouldn't be surprised if one day they decided to charge for this service.

#### Hostinger Shared Hosting

Hostinger is a great option if you want more control of the build Framework and deployment pipeline. The Premium shared hosting plan allows you to have up to 100 websites and uses LiteSpeed web server, which is known for speed. I choose Hostinger over other popular shared hosting like GoDaddy mostly because of the user experience of their site, and straight forward FTP account setup.

Added bonus is you can host PHP files or WordPress sites if you want. It includes MySql Databases as well.

The downside to Hostinger or any other shared hosting plan is that you will need to do more initial setup with build and deploy, like Github Actions, and you have to worry about keeping that FTP account secure.

### API and Databases hosting

For projects that require a web server to execute server code, or persisting data in a database. I like to use a Linux Virtual Private Server. With a VPS, I have the freedom to use any software or frameworks and also get to learn about server administration.

#### Ionos VPS

The Ionos VPS S plan comes with 1 virtual CPU core, 512 MB of RAM and 10 GB of SSD. I'm currently using this for small Deno API with an SQLite DB and Nginx reverse proxy.
With root access to the VPS I am able to setup systemd start / stop on deploy and cron jobs for daily backups.

If you want to use custom domain for your API and DB, create a `DNS A record` to point to your VPS IP address.

The drawback for VPS is you need to do everything yourself. It can be a lot of work to set up the build pipeline, systemd configurations, backups, logs, etc. I suggest containerizing the app to make it easier.

#### Digital Ocean Shared Droplet

Another great option for VPS with root access is the Digital Ocean Droplet. It is much pricier but has added benefits of auto scaling resources, if that's something you need.

For projects that you want to shelve for later, they also have a nice snapshot feature that allows you store the state of your droplet and power it down so you only pay $0.15/month. When you want to resume your project, simple restore the droplet from the snapshot.

The droplets are just like any other VPS hosting provider, so be prepared to setup the server by yourself.

### Honorable Mentions

#### Cloud Cannon - <https://cloudcannon.com>

This is a super cool tool for static generated sites. If you're looking to have clients able to change the content of a website but don't want a full blown CMS like WordPress, you should check this out.

#### Heroku - <https://www.heroku.com>

I haven't personally used Heroku, but reading feature set seems like this would be a big time saver. If I ever get tired of setting up Virtual Private Servers, Heroku will be my next best option. They also have a free tier for Dynos (Linux containers) which is perfect for personal projects.

---

## The End

No matter which hosting provider you choose, if you can get your projects hosted that's still a win. If you have any suggestions for me on a hosting providers I should look at let me know.

Thanks for reading!
