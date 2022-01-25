---
title: 'Strategy Pattern and Null Object Pattern'
date: 2022-01-24T00:00:00-07:00
tags: ['design-patterns']
author: 'Hubert Lin'
showToc: false
TocOpen: false
draft: false
hidemeta: false
comments: true
description: 'A C# implementation of the Strategy and Null Object pattern.'
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

Most of the code I've been writing is automating business processes.
As a programmer I tell the computer what to do under specific conditions, and often
those conditions change. Trying to make correct decisions
can be paralyzing because it's hard to know what new requirements will come.

Thank goodness for software design patterns.

Software design patterns can help write code that is resilient to future change.
Here's my take on the Strategy Pattern and the Null Object Pattern.

Let's go through a typical request from the business.
My example begins with a payroll app.
The application handles paying employees and deducting their benefits.
It looks like this:

- `Employee` model that's persisted to the database
- `PaymentService` that has our business logic
- `IHumanResourcesGateway` that actually does the e-transfer and benefits
- `PaymentsController` for the REST API

```csharp
// Employee.cs
public class Employee
{
  public string Id { get; set; }
  public string Email { get; set; }
  public decimal HourlyWage { get; set; }
  public Guid? BenefitsPackage { get; set; }
}
```

```csharp
// PaymentService.cs
private IHumanResourcesGateway _hr;
public PaymentService(IHumanResourcesGateway hr)
{
  _hr = hr;
}
public void Pay(Employee employee)
{
  _hr.DeductBenefits(employee.Id, employee.benefitsPackage);
  _hr.SendETransfer(employee.Email, employee.HourlyWage);
}
```

```csharp
// IHumanResourcesGateway.cs
public interface IHumanResourcesGateway
{
  void DeductBenefits(string id, Guid? benefitsPackage);
  void SendETransfer(string email, decimal hourlyWage);
}
```

```csharp
// PaymentsController.cs
[HttpPost("payments")]
public IActionResult Pay(Employee employee)
{
  _paymentService.Pay(employee); // _paymentService is injected in the constructor
  return Ok();
}
```

## Requirement 1: Pay part-time employees

Now that we have the app up and running, the business has a new requirement.
The system needs to handle part-time employees. Part-time employees also get paid,
but do not receive benefits.

Seems simple. One approach is to differentiate the type of employment to allow us to
figure out how to handle their payment, so let's add an `enum` called `EmploymentType`.

```csharp
// EmploymentType.cs
public enum EmploymentType
{
  FullTime,
  PartTime
}
```

I'll also need to add the type to the `Employee` model.

```csharp
// Employee.cs
public class Employee
{
  public string Id { get; set; }
  public string Email { get; set; }
  public EmploymentType Type { get; set; } // <-- new
  public decimal HourlyWage { get; set; }
  public Guid? BenefitsPackage { get; set; }
}
```

Great, now let's conditionally change the `Pay(...)` method based on the type.
The quick and simple solution would be to add an `if` condition.

```csharp
// PaymentService.cs
public void Pay(Employee employee)
{
  if (employee.Type == EmploymentType.FullTime)             // <-- new
  {                                                         // <-- new
    _hr.DeductBenefits(employee.Id, employee.benefitsPackage);
    _hr.SendETransfer(employee.Email, employee.HourlyWage);
  }                                                         // <-- new
  else if (employee.Type == EmploymentType.PartTime)        // <-- new
  {                                                         // <-- new
    _hr.SendETransfer(employee.Email, employee.HourlyWage); // <-- new
  }                                                         // <-- new
}
```

This a little verbose but it works. Let's figure out if I need to refactor.

> 1. Can I unit test the condition separate from the behavior?
> 2. Will there be changes to the condition?
> 3. Will there be changes to the behavior?

I don't know if there are future changes coming, but I do know that
I cannot unit test the conditions separate from the behaviors.

And even worse, now that we introduced types it won't be long before some other part of the system
will depend on checking the `EmploymentType`. The same `if` condition will be duplicated.
It would be nice to have solid test cases that can test the conditions separate from
the behavior. That would allow us to have confidence in our future changes.

I've seen this type of solution a lot, and I mean A LOT!
This is fine in small applications, but in enterprise applications,
it's just a matter of time before an "oops", especially because it's hard to test.

Let's refactor.

### Strategy Pattern

There are two types of payments, full-time and part-time, I can consider each of these payments as a strategy.
Remember, strategies are just different implementations of the same action.
They take in the same parameters and return the same type, but what they do inside is the difference.
I'll start with defining the `IPaymentStrategy` interface.

```csharp
public interface IPaymentStrategy
{
  void Pay(Employee employee, IHumanResourcesGateway hr);
}
```

Now I can implement the strategy for full-time and part-time.
I basically moved the contents of the original `if` blocks into each concrete strategy.

```csharp
public class FullTimePay : IPaymentStrategy
{
  public void Pay(Employee employee, IHumanResourcesGateway hr)
  {
    hr.DeductBenefits(employee.Id, employee.BenefitsPackage);
    hr.SendETransfer(employee.Email, employee.HourlyWage);
  }
}

public class PartTimePay : IPaymentStrategy
{
  public void Pay(Employee employee, IHumanResourcesGateway hr)
  {
    hr.SendETransfer(employee.Email, employee.HourlyWage);
  }
}
```

Next, I need a way to select the correct strategy. If there is complex
logic I could use a `PaymentStrategyContext` class to place the conditional logic,
but in this case I'm just checking the `EmploymentType`, which is a single field,
so a dictionary will work fine. I'll store the dictionary in the `PaymentService` class 
for now.

```csharp
// PaymentService.cs
private Dictionary<EmploymentType, IPaymentStrategy>
  _paymentStrategies = new Dictionary<EmploymentType, IPaymentStrategy>
{
  { EmploymentType.FullTime, new FullTimePay() },
  { EmploymentType.PartTime, new PartTimePay() }
}
```

Finally, I can update our service to use the newly created strategies.

Say goodbye to the `if` condition!

```csharp
// PaymentService.cs
public void Pay(Employee employee)
{
  _paymentStrategies[employee.Type].Pay(employee, _hr);
}
```

Wow nice! We wrote a whole bunch more code just to remove two `if` conditions.
Is this actually helpful?

If the system never changes again then we wasted our time.

The strategy pattern prevents duplication of conditional logic and helps us to follow DRY: Don't Repeat Yourself. By consolidating the conditional behavior into one place, I can easily add new behaviors and modify conditions.
Also, I can now unit test the conditions separately from the behavior.

## Requirement 2: "Pay" those Volunteers

Now the business is interested in hiring some volunteers. The thing about volunteers
is that, they receive no pay and no benefits. Let's first add to our `EmployementType`.

```csharp
// EmploymentType.cs
public enum EmploymentType
{
  FullTime,
  PartTime,
  Volunteer // <-- new
}
```

One option is to just add the `if` condition that checks their type but that's the same as before.
We don't want to do that.

```csharp
// PaymentService.cs
public void Pay(Employee employee)
{
  if (employee.Type != EmploymentType.Volunteer) // <-- BAD
    _paymentStrategies[employee.Type].Pay(employee, _hr);
}
```

Instead, I'll take the strategy pattern a step further.
Let's define a strategy for when someone doesn't get paid.

### Null Object Pattern

A payment strategy for no payment.

```csharp
public class NoPay : IPaymentStrategy
{
  public void Pay(Employee employee, IHumanResourcesGateway hr)
  {
    return; // do nothing
  }
}
```

I add it to the dictionary of payment strategies, and the rest of the code just works.

```csharp
// PaymentService.cs
private Dictionary<EmploymentType, IPaymentStrategy>
  _paymentStrategies = new Dictionary<EmploymentType, IPaymentStrategy>
{
  { EmploymentType.FullTime, new FullTimePay() },
  { EmploymentType.PartTime, new PartTimePay() },
  { EmploymentType.Volunteer, new NoPay() } // <-- new
}
```

## Summary

The bigger an application grows the easier it is to duplicate conditional logic.
In the case of conditional behavior, we can leverage the **Strategy Pattern** and the **Null Object Pattern** to help with managing change. This makes it easier to add and modify behavior to adapt throughout the system.

A bonus is that we can separate the testing of condition from testing of behavior.
In our example we did not need to unit test the dictionary, but when the
conditional logic in the `Dictionary<Key,Strategy>` becomes more complex we can move it to a context class.
Then we can unit test the `GetStrategy(...)` method on its own.
The context will be the single source of truth for selecting concrete `IPaymentStrategy`.

```
// PaymentStrategyContext.cs
public class PaymentStrategyContext
{
  public IPaymentStrategy GetStrategy(Employee employee)
  {
    if (...)
      return new FullTime();
    else if (...)
      return new PartTime();
    else
      return new NoPay();
  }
}
```

So many videos, blogs, and readings have helped me grow my understanding of these patterns.
I am not an expert at these patterns, so I apprectiate your feedback.

Thanks for reading!

## References

- [[Video] Nothing is Something](https://www.youtube.com/watch?v=29MAL8pJImQ) - Sandi Metz
- [[Video] Strategy Pattern – Design Patterns](https://www.youtube.com/watch?v=v9ejT8FO-7I&t=77s) -
  Christopher Okhravi
- [[Book] Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.ca/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) - GoF
- [[Website] https://sourcemaking.com/design_patterns/strategy](https://sourcemaking.com/design_patterns/strategy)
