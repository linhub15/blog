---
title: "Closing Bootstrap nav in Angular"
date: 2019-01-28T00:00:00-07:00
tags: [""]
author: "Hubert Lin"
showToc: false
TocOpen: false
draft: false
hidemeta: false
comments: false
description: ""
disableHLJS: false # to disable highlightjs
disableShare: false
searchHidden: false
cover:
  image: "<image path/url>" # image path/url
  alt: "<alt text>" # alt text
  caption: "<text>" # display caption under cover
  relative: false # when using page bundles set this to true
  hidden: true # only hide on current single page
---


* Does your app use Bootstrap 4?
* Does your app use Angular 6+?
* Does navbar stay open even when navigating to different components? (Mobile)

I fixed the problem using Angular [attribute directive](https://angular.io/guide/attribute-directives).

### How the bootstrap toggler works

When the bootstrap toggler is clicked it calls the `.collapse()` from the `ul.nav-list`, adds `.collapsing` before the animation starts, adds `.show` and finally removes the `.collapsing` class.

### .show

Try removing `.show` from the open navbar. Notice how it disappears without the animation? If you just want to hide the nav and don't want animations, this works fine.

So in the end here's my little directive.

```
import { Directive, HostListener } from '@angular/core';

@Directive({ selector: '[appCloseNav]' })
export class CloseNavDirective {

  constructor() { }

  @HostListener('click')
  onClick() {
    if (document.documentElement.clientWidth > 768) { return }
    const links = document.getElementById('navbarLinks');
    const navToggler = document.getElementById('navbarToggler');
    if (links.classList.contains('show')) { navToggler.click(); }
  }
}
```

### Use the directive in html template

To use the directive, place the selector name on the desired html element that you want to have the behavior. I put it on my div.content-wrapper.

```
<app-top-nav></app-top-nav>

<!-- appCloseNav directive closes the top-nav.component -->
<div id="content-wrapper" appCloseNav> 
  <div class="container" role="document">
    <div class="row">
      <section class="col-12 mt-1" id="content" >
        <router-outlet></router-outlet>
      </section>
    </div> <!-- / .row -->
  </div> <!-- / .container -->
</div> <!-- / .cotent-wrapper -->

<app-footer></app-footer>
```

Hope this simple solution works for you as it did for me. Feel free to ask me questions or provide suggestions. I'm always looking to learn.