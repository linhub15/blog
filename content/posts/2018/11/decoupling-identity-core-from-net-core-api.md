---
title: "Decoupling Identity Core from .NET Core Api"
date: 2018-11-30T00:00:00-07:00
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
searchHidden: true
cover:
  image: "<image path/url>" # image path/url
  alt: "<alt text>" # alt text
  caption: "<text>" # display caption under cover
  relative: false # when using page bundles set this to true
  hidden: true # only hide on current single page
---

During my quest to make my architecture "clean" there was a **HUGE** dependency that needed to be inverted: <u><em>Microsoft.AspNetCore.Identity</em></u>. Even though many applications require authentication, we still shouldn't be depending on any authentication frameworks.
{: .present-before-paste}

According to Robert C. Martin we shouldn't depend on a framework because the business rules can change or the frameworks can change. We keep things loosely coupled so that in case we need to swap out an implementation we can do so without affecting our business rules.
{: .present-before-paste}

At first, my code following typical ASP.NET Core folder structure: Models, Controllers etc. I had the authentication logic in my *AuthenticationController.cs,*&nbsp;so that's where I injected UserManager&lt;TUser&gt; and SignInManager&lt;TUser&gt;. Just in case you're not familiar with Identity Core, those two managers help us handle users and signing them in. The &lt;TUser&gt; is a class of user, e.g. IdentityUser is the Microsoft User class.
{: .present-before-paste}

The newly decoupled project layout follows this folder structure:
{: .present-before-paste}

1. Core - Core Business details, does not depend on anything but itself
2. Infrastructure - Implements and depends on core interfaces
3. API - Public facing layer that depends on Infrastructure and Core

## Steps to Decouple

#### 1. Define authentication methods

We need to ***register*** and ***sign in*** a user. I didn't include a ***sign out*** because I will be using JSON Web tokens and they will have a short expiry date. It's&nbsp;<u>not secure</u> so don't do this in a real application.
{: .present-before-paste}

![](/uploads/iauthenticator-1.jpg)
{: .present-before-paste}

#### 2. Define User Class
{: .present-before-paste}

Next, we'll need to define the&nbsp;**User**&nbsp;object that we're passing into Register. In my case I only have 3 fields. User name, email, and password.
{: .present-before-paste}

![](/uploads/user.jpg)
{: .present-before-paste}

That's it for the Core.
{: .present-before-paste}

#### 3. Implement IAuthenticator in Infrastructure
{: .present-before-paste}

In the infrastructure layer, we create an Authenticator to implement the IAuthenticator interface. This is where we include dependencies on Microsoft.AspNetCore.Identity as well as all other dependencies we will be using.

* Use dependency injection for any required objects / services / managers… etc
* Include helper method to generate JSON Web Token

```csharp
public class Authenticator : IAuthenticator
{
    private readonly MyDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;

    public Authenticator(
        MyDbContext context,
        UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager)
    {
        _context = context;
        _userManager = userManager;
        _signInManager = signInManager;
    }

    private string GenerateJwt(string userName, IdentityUser user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes("someRandomKey123abc"));

        var creds = new SigningCredentials(
            key, SecurityAlgorithms.HmacSha256);

        var expires = DateTime.Now.AddDays(1);

        var token = new JwtSecurityToken(
            "JwtIssuer",
            "JwtIssuer",
            claims,
            expires: expires,
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

*\*key, expiry date, and JwtIssuer should be included in an application config file*

* Implement Register()
* Implement SignIn()

```csharp
public IdentityResult Register(User user)
{
    IdentityUser newUser = new IdentityUser {
        UserName = user.userName,
        Email = user.email };
    return _userManager.CreateAsync(newUser, user.password).Result;
}

public string SignIn(string userName, string password)
{
    var result = _signInManager.PasswordSignInAsync(
        userName, password, false, false);
    if (result.Succeeded)
    {
        var user = _userManager.Users
            .SingleOrDefault(u => u.userName == userName);
        return GenerateJwt(userName, user);
    }
    else
    {
        return  "result.Succeeded == false";
    }
}
```

#### 4. Use the Authenticator in our API Controller
{: .present-before-paste}

With the implementation complete we can pass in our Authenticator instance with dependency injection into the controller.

```csharp
[Route("api/[Controller]/[Action]")]
[ApiController]
public class AuthenticationController : ControllerBase
{
    private readonly Authenticator _authenticator;

    public AuthenticationController(Authenticator authenticator)
    {
        _authenticator = authenticator;
    }

    [HttpPost]
    public ActionResult Register([FromBody] User user)
    {
        TryValidateModel(user);
        _authenticator.Register(user);
        return Ok();
    }

    [HttpPost]
    public ActionResult<string> Login([FromBody] User user)
    {
        TryValidateModel(user);
        return _authenticator.SignIn(user.userName, user.password)
    }
}
```

This code refactoring was inspired by "Clean Architecture" by Robert C. Martin. I'm still pretty new at software design and programming so feel free to offer suggestions and point out any errors you find.