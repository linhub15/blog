---
title: 'Choosing a z-index convention with Tailwind CSS'
date: 2024-04-26T00:00:00-07:00
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
  image: ''
  alt: ''
  caption: '' # display caption under cover
  hidden: false # only hide on current single page
---

By default, `position: static` elements stack automatically and share the same
`z-index`.

- button appears over the div

Some components break the default flow of the dom so need to have explicit
z-index.

Components that use z-index: nav, popover (menu, tool tip), dialog (modal),
drawer, toast

- popover menus should normally just be `z-0` unless they are inside a modal

Tailwind CSS offers default utilities for z-index `z-0`, `z-10`, `z-20`, `z-30`,
`z-40`, `z-50`.

We can map them like this

## Nav

- top nav `default`
- top nav position:fixed `z-10`
- side nav `default`
- side nav

## Popover

- normal `default`
- nested: parent + 1

## Dialog

If we use z-50, then popover menus inside the dialog could be cropped when
exceeding the size of the dialog

So let's set a dialog to z-40. But what if a toast pops up and the menu is open?

so dialog should be z-30, menu can be z-40, and toast can be z-50.

- note if the menu is not inside a dialog, then the z-index should be `z-20`

## z-0

The default z-index. Will be set to this with `z-auto`

## z-10

Use this for interactive elements that menus, custom drop downs, popovers, tool
tips.

## z-20

Use this for static page elements that are non-interactive and need to cover
those interactive elements. Good for navbars, drawers

## z-30

Reserved for modals and drawers that have backdrops. This one needs to take over
the whole screen and limit user interaction with the layer below.

## z-40

Can be used for popups that need to cover the modal

## z-50

For anything that must be above them all. Like toast notifications.
