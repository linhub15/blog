---
title: 'UX case study for log in and sign up buttons'
date: 2021-09-26T00:00:00-07:00
tags: ['ux']
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
  alt: 'UX Case Study Log In Sign Up Buttons' # alt text
  caption: '' # display caption under cover
  relative: true # when using page bundles set this to true
  hidden: false # only hide on current single page
---

If you're like me, then you've tried to log into a website and got confused with
which button to click. The placement, terminology and styling often throws me
off. For authentication we often see `log in`, `sign in` and for registration
words like `sign up` or `create account`.

In this case study, I want to determine which terminology should be used as
default for authentication and registration buttons. Then, identity common
patterns of placement for these buttons when viewed on a personal computer
(monitor) not a mobile device. We will look at 10 common social media websites
and 10 web developer websites and see what they do.

### Social Media Sites

| Url           | Auth            | Registration             | Placement                                              |
| ------------- | --------------- | ------------------------ | ------------------------------------------------------ |
| facebook.com  | Log In          | Create New Account       | Landing page right                                     |
| twitter.com   | Sign In         | Sign Up With ...         | Landing page right                                     |
| linkedin.com  | Sign in         | Join Now                 | Landing page left; Nav top right                       |
| youtube.com   | SIGN IN         | Create Account           | Nav top right; Registration is hidden behind Auth form |
| pinterest.com | Log in          | Sign up                  | Nav top right                                          |
| instagram.com | Log In          | Sign up                  | Landing page right                                     |
| tumblr.com    | Log in / Log In | Sign up                  | Landing page center; Nav top right                     |
| twitch.tv     | Log In          | Sign Up                  | Nav top right                                          |
| flickr.com    | Log In          | Sign Up / Start for free | Nav top right                                          |
| reddit.com    | Log In          | Sign Up                  | Nav top right                                          |

### Developer Sites

| Url                   | Auth       | Registration                      | Placement     |
| --------------------- | ---------- | --------------------------------- | ------------- |
| github.com            | Sign in    | Sign up                           | Nav top right |
| about.gitlab.com      | Login      | Get free trial                    | Nav top right |
| developers.google.com | Sign in    | n/a                               | Nav top right |
| aws.amazon.com        | My Account | Create an AWS Account             | Nav top right |
| azure.microsoft.com   | Sign in    | Free account / Try Azure for free | Nav top right |
| cloudflare.com        | Log In     | Sign Up                           | Nav top right |
| digitalocean.com      | Log In     | Sign Up                           | Nav top right |
| godaddy.com           | Sign In    | n/a                               | Nav top right |
| npmjs.com             | Sign In    | Sign Up                           | Nav top right |
| codepen.io            | Log In     | Sign Up                           | Nav top right |

## Conclusion

### Authentication

- `Log in` or variations - 11
- `Sign in` or variations - 8

### Registration

- `Sign up` or variation - 12
- `Create ...` or similar - 3
- remaining terms are all unique

It appears that the results for authentication lean slightly towards the wording
`Log in` while `Sign in` is a very close second option. For registration,
`Sign up` is the clear winner. Other options vary, but `Create ...` seems to be
the next most viable.

If `Sign up` is chosen for registration, then it would be logical to avoid
`Sign in` because they are so similar. Although styling the buttons differently
may help distinguish `Sign in` & `Sign up`, they only differ by one letter so it
is easy to mistake.

As for registration, most occurences of `Create ...` happen when the action is
displayed in the Landing page, not the nav. Since the nav often contains many
items, using `Create ...` may take up too much horizontal space. Having succinct
terms for the nav would reduce visual clutter.

### Rules

- use `Sign Up` for registration by default.
- use `Log In` for authentication by default.
- accent the registration button `Sign Up` with a border or background color.
- position `Log In` and `Sign Up` buttons on the top right of the page.
  Preferably on the top nav bar.
- position `Log In` before `Sign Up`.
- using `Create Account` or a variation is permitted for registration if there
  is enough horizontal space. Preferably on a landing page form.
- using `Sign In` is only permitted for authentication if `Sign Up` is not used
  for registration.

## Screenshots

### Facebook

![facebook](imgs/facebook-auth.png)

### Twitter

![twitter](imgs/twitter-auth.png)

### LinkedIn

![linkedin](imgs/linkedin-auth.png)

### Youtube

![youtube](imgs/youtube-auth.png)

### Pinterest

![pinterest](imgs/pinterest-auth.png)

### Instagram

![instagram](imgs/instagram-auth.png)

### Tumblr

![instagram](imgs/tumblr-auth.png)

### Twitch

![twitch](imgs/twitch-auth.png)

### Flickr

![flickr](imgs/flickr-auth.png)

### Reddit

![reddit](imgs/reddit-auth.png)

## Developer Sites

### Github

![github](imgs/github-auth.png)

### Gitlab

![gitlab](imgs/gitlab-auth.png)

### Google Developers

![google-devs](imgs/google-devs-auth.png)

### Amazon Web Services (AWS)

![aws](imgs/aws-auth.png)

### Microsoft Azure

![azure](imgs/azure-auth.png)

### Cloudflare

![cloudflare](imgs/cloudflare-auth.png)

### Digital Ocean

![digital-ocean](imgs/digital-ocean-auth.png)

### Go Daddy

![godaddy](imgs/godaddy-auth.png)

### NPM

![npmjs](imgs/npmjs-auth.png)

### Codepen

![codepen](imgs/codepen-auth.png)
