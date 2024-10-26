---
title: "Edmonton Property Value Finder"
date: 2018-07-11T00:00:00-07:00
tags:
author: "Hubert Lin"
showToc: false
TocOpen: false
toc: false
draft: false
hidemeta: false
comments: false
description: ""
disableHLJS: false # to disable highlightjs
disableShare: false
searchHidden: true
cover:
  image: "<image path/url>" # image path/url
  alt: "<alt text>" # alt text
  caption: "<text>" # display caption under cover
  relative: false # when using page bundles set this to true
  hidden: true # only hide on current single page
---

The Edmonton Property Value Finder is a tool for Edmontonians to find out the
assessed value of their property from the City of Edmonton Open Data Set. I
built this app to learn about consuming data from a web API and chose to make
something that could benefit others as well.

The first iteration of the app used the Bootstrap 4 Framework for front-end
components and jQuery for handling the API requests. The second iteration of the
app is built as an Angular single page application with Angular Material for
front-end components.

_Although the data is from the City of Edmonton, I cannot guarantee the
**accuracy** or the **freshness** of the data._

[Try Out the App](https://open-property.ca)

## So what's it do?

The app takes your property's address and finds the corresponding assessment
value for it.

1. Input your property address
2. The app will submit a get request with the query string parameters to the
   City of Edmonton Open Data API
3. The app receives the data and identifies your assesement value
4. The app displays the assessment value

## Nice to have feature: Neighbourhood Average

With the data set containing a neighbourhood field, I would like to implement a
feature that displays the average assessment of your neighbourhood. Display this
side by side with your assessed value so that you have an idea of where your
property stands in relation to your neighbours.
