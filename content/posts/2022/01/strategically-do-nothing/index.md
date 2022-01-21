---
title: 'Not doing is still a strategy of doing'
date: 2022-01-21T00:00:00-07:00
tags: ['']
author: 'Hubert Lin'
showToc: false
TocOpen: false
draft: true
hidemeta: false
comments: true
description: 'A scenario based walk through on implementing two software design patterns. The Strategy Pattern and Null Object pattern'
disableHLJS: false # to disable highlightjs
disableShare: false
searchHidden: false
cover:
  image: '<image path/url>' # image path/url
  alt: '<alt text>' # alt text
  caption: '<text>' # display caption under cover
  relative: true # when using page bundles set this to true
  hidden: false # only hide on current single page
---

Most of the code I write is automating business processes. If something, then do something.
As a programmer I tell the computer what to do under specific conditions, and sometimes
those conditions change. Figuring out whether or not what I'm doing is right or wrong,
can be paralyzing because who knows what new requirements will come.

Thank goodness for software design patterns.

Here's my take on the Strategy Pattern and the Null Object Pattern.

My example begins with a payroll app.
The application handles paying employees and their benefits.
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
  paymentService.Pay(employee); // paymentService is injected in the constructor
  return Ok();
}
```

## Requirement 1: Add support to pay part-time employees

Okay now that we have the app up and running, the business has a new requirement.
The system needs to handle part-time employees. They get paid, but receive benefits.

Okay, simple, I know I'll need to differentiate the type of employment for each employee
so let's add an enum for `EmploymentType`.

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
The quick and simple solution would be to add an `if` statement.

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

This a little verbose but it works. This is a good place to
figure out if I need to refactor.

> 1. Can I unit test the condition separate from the behavior?
> 2. Will there be changes to the condition?
> 3. Will there be changes to the behavior?

I don't know if there are future changes coming, but I do know that
I cannot unit test the conditions separate from the behaviors.

And even worse, now that we introduced types it won't be long before some other part of the system
will depend on checking the `EmploymentType`. The same `if` condition will be duplicated.

I don't know about you but I've seen this a lot, and I mean A LOT!
This is fine in small applications, but in enterprise applications,
it's just a matter of time before an "oops".

Let's refactor.

### Strategy Pattern

I know there are two types payments, full-time and part-time, so I'll call these strategies.
Remember, strategies are just different implementations of the same action.
They take in the same parameters and return the same type, but what they do inside is the difference.
I'll start with defining the strategy `IPaymentStrategy` interface.

```csharp
public interface IPaymentStrategy
{
  void Pay(Employee employee, IHumanResourcesGateway hr);
}
```

Now I can implement the strategy for full-time and part-time.
I basically moved the contents of the original `if` blocks into each strategies.

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

Next, we need a way to select the correct strategy. If we had complex
logic I would use a `PaymentStrategyContext` to place the conditional logic,
but in this case I'm just checking the `EmploymentType`. A dictionary will be perfect `Dictionary<EmploymentType, IPaymentStrategy>`.
I'll store it in the `PaymentService` for simplicity.

```csharp
// PaymentService.cs
private Dictionary<EmploymentType, IPaymentStrategy>
  _paymentStrategies = new Dictionary<EmploymentType, IPaymentStrategy>
{
  { EmploymentType.FullTime, new FullTimePay() },
  { EmploymentType.PartTime, new PartTimePay() }
}
```

Finally I can update our service to use the strategies.
Say goodbye to `if` statements!

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

The strategy design pattern prevents duplication of conditional logic and helps us to follow DRY: Don't Repeat Yourself. By consolidating the conditional behavior into one place, I can easily add new behaviors and modify conditions.
Also, I can now unit test the conditions separately from the behavior.

## Requirement 2: Our company has Volunteers now

Now the business is interested in hiring some volunteers. The thing about volunteers
is they don't get paid and they don't get benefits. I do not want to write an
entire code path just for volunteers that don't get paid.

```csharp
// EmploymentType.cs
public enum EmploymentType
{
  FullTime,
  PartTime,
  Volunteer // <-- new
}
```

We could just add an `if` statement that checks their type but now we're back where we started.

```csharp
// PaymentService.cs
public void Pay(Employee employee)
{
  if (employee.Type != EmploymentType.Volunteer)
    _paymentStrategies[employee.Type].Pay(employee, _hr);
}
```

Instead, I'll keep going with the strategy pattern take it a step further.
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

I add it to dictionary of payment strategies, and the rest of the code will just work.

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

The bigger an application grows the easier it is to duplicate conditional logic. In the case of conditional behavior, we can leverage the **Strategy Pattern** and the **Null Object Pattern** to help with managing change. This makes it easier to add and modify behavior to adapt throughout the system.

One bonus from these patterns is that we can now isolate the unit tests of condition from behavior. We can write tests for each strategy and if the conditional logic moves from the `Dictionary<Key,Strategy>` to a `StrategyContext.GetStrategy()` with `if` statements, we can also unit test that `StrategyContext.GetStrategy()` method to ensure it returns the intended strategy.

So many videos, blogs, and readings have helped me grow my understanding of these patterns.
I am no way an expert at thse patterns and am just getting started.

## References

- [[Video] Nothing is Something](https://www.youtube.com/watch?v=29MAL8pJImQ) - Sandi Metz
- [[Video] Strategy Pattern – Design Patterns](https://www.youtube.com/watch?v=v9ejT8FO-7I&t=77s) -
  Christopher Okhravi
- [[Book] Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.ca/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) - GoF
- [[Website] https://sourcemaking.com/design_patterns/strategy](https://sourcemaking.com/design_patterns/strategy)
