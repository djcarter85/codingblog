---
title: "Make your automated tests easy to read"
summary: "Recently I've been trying to improve the readability of the automated tests that I write for my code. How have I done this, and why am I even bothering?" 
---

Ever since I started working as a software developer, writing automated tests has been part of my approach to building software.
This has come in many forms, including as part of [TDD](https://en.wikipedia.org/wiki/Test-driven_development) and writing tests for previously-uncovered code.

But recently I've been taking a step back to consider the quality of the tests that I write.
There is lots of material out there about how to write good-quality code, but not so much on what constitutes good-quality tests.

The big point I want to get across in this article is as follows: ***make your automated tests easy to read***.
This is the pithy headline that I will spend the rest of this article explaining!

## Why?

Here are a few reasons I can think of to make your test code as easy to read as possible:

- A human being will have to read and modify the tests. If they can't work out what the tests are currently checking, how will they know how to adapt them to changing requirements? This is particularly pertinent when it comes to deleting tests: it should be clear when a test is no longer needed.
- Because automated tests verify the behaviour of the code, they serve as documentation for the behaviour of the system. Documentation should be easy to read.
- Tests are only useful because they *might* fail. When that happens, whoever is working on the code at the time will thank you for making it as easy as possible to determine what is wrong with the code.

## Techniques

"But how do I do that, Dan?" I hear you ask. Well, imaginary reader who just happened to ask a very pertinent question, here are some of the techniques I've been using to improve the readability of my tests.

### 1. Name your tests as statements of fact about the behaviour of the code

[An article by Vladimir Khorikov on the subject of test naming](https://enterprisecraftsmanship.com/posts/you-naming-tests-wrong/) has proved very useful to our team recently.
One of the big things I took from the article is this:

> Name the tests as if you were describing the scenario in it to a non-programmer familiar with the problem domain.

Let's look at an example. Suppose you have the following test that follows a naming pattern common in the industry.

```c#
public class CustomerTests
{
    [Test]
    public void Test_IsEmailAddressValid_Garbage_Invalid()
    {
        var customer = new Customer(
            id: 1,
            name: "Joe Bloggs",
            emailAddress: "g5#^559RY^bcb!co",
            dateOfBirth: new LocalDate(1970, 01, 01));

        Assert.That(customer.IsEmailAddressValid, Is.False);
    }
}
```

This test name has a couple of problems:
- It's not very readable. Even a developer will who knows the code will have a hard time deciphering it; a product owner who doesn't know the code will have no chance.
- If the property name changes, the test name needs to change. This suggests that the test is too closely tied to implementation. Tests are about behaviour, not implementation.

How about we write the test name as a statement of fact about the behaviour of the system?

```c#
public class CustomerTests
{
    [Test]
    public void Garbage_email_address_is_invalid()
    {
        var customer = new Customer(
            id: 1,
            name: "Joe Bloggs",
            emailAddress: "g5#^559RY^bcb!co",
            dateOfBirth: new LocalDate(1970, 01, 01));

        Assert.That(customer.IsEmailAddressValid, Is.False);
    }
}
```

One of the best things about this way of naming tests is that anyone familiar with the problem domain could read and understand it.

This has made a huge difference to our team's ability to test our code. Now our testers and product owners can review which aspects of the system that are covered by tests. Sometimes I will work with a tester to come up with all the test names before I've even written any production code!

### 2. Keep each test small

Before applying technique 1, I would often end up writing tests that checked many properties of the output of the system under test in one go. However, it's usually impossible to come up with a simple statement about the behaviour of the code for a test like that. I found I was often resorting to tests called `..._works_correctly` which, let's face it, is a massive cop-out.

The fix for this is to rework the tests so that each test checks one thing.
Once that is done, giving the test a name is easy!
This results in better tests, because if the test fails it's clear straight away what the problem is: the name of the failing test is a fact about the behaviour of the code which is currently not true!

Some people claim that each unit test should only have one assertion in it; and take that to mean (in the case of NUnit) that your test should only contain one reference to the `Assert` class.
I would argue that the sentiment is correct but the rule is flawed.
Often it takes more than one assertion to check a single fact about the behaviour of the code under test, and this is highly dependent on the API of the unit testing framework you are using.
[This answer to a StackOverflow question](https://softwareengineering.stackexchange.com/a/171502) is a good example of this.

### 3. Remove irrelevant values by using creator classes

If you aim to keep your tests small, you'll often end up with setup code containing irrelevant values.

For example, consider again the test from above. Most of the values supplied to the `Customer` class are irrelevant. Wouldn't it be nice if we could strip out those values so only the relevant ones remain?

Let's create a helper class ...

```c#
public static class CustomerCreator
{
    public static Customer WithEmailAddress(string emailAddress)
    {
        return new Customer(
            id: 1,
            name: "Joe Bloggs",
            emailAddress: emailAddress,
            dateOfBirth: new LocalDate(1970, 01, 01));
    }
}
```

... and use it ...

```c#
public class CustomerTests
{
    [Test]
    public void Garbage_email_address_is_invalid()
    {
        var customer = CustomerCreator.WithEmailAddress("g5#^559RY^bcb!co");

        Assert.That(customer.IsEmailAddressValid, Is.False);
    }
}
```

Much simpler!
It's now very clear that the test is checking what the title claims to be checking.

If the test is more complicated (for example if the customer is only one of a number of arguments being passed to the method under test), this streamlining of the test method can make a huge difference.
This also helps with the application of technique 2: often, the complication of setting up all the different arguments would encourage me to only do it once and have multiple assertions in a single test.

These methods could be private to the test class, but I prefer to put them in their own class as they will most likely be useful for many tests, especially if the types in question are central to your problem domain.

### 4. Static imports for creator methods

We could streamline the above example even further by using the [static imports feature of C# 6](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/using-static):

```c#
using static Example.CustomerCreator;

public class CustomerTests
{
    [Test]
    public void Garbage_email_address_is_invalid()
    {
        var customer = CustomerWithEmailAddress("g5#^559RY^bcb!co");

        Assert.That(customer.IsEmailAddressValid, Is.False);
    }
}
```

Notice that we've also renamed the method so that it's clear it's returning a customer.

### 5. Dependency defaults

Sometimes you'll be testing a class that has many dependencies injected in the constructor (a good example could be an ASP.NET Core controller).

Often, only a subset of the dependencies will actually be pertinent to each test.
For example, the controller may depend on `IClock` for fetching the current time, but it is not used in the method that is being tested.
Or perhaps it *is* used, but the value of the current time is irrelevant to the particular aspect of behaviour that is being checked.

If this is the case, I like to use a helper method for creating the class under test.
This is similar to the `...Creator` classes in technique 3, except that it is private to the test class (as it is only used there), and has default values for all the dependencies (so that tests only need to specify the ones that are relevant).

Here's an example:

```c#
public class CustomerControllerTests
{
    [Test]
    public void Test()
    {
        var controller = CreateCustomerController(
            configuration: ConfigurationCreator.ThrowsException());

        // etc ...
    }

    private static CustomerController CreateController(
        IClock clock = null,
        IConfiguration configuration = null)
    {
        if (clock == null)
        {
            clock = new FakeClock(Instant.FromUtc(2020, 01, 01, 00, 00, 00));
        }

        if (configuration == null)
        {
            configuration = ConfigurationCreator.WithKeyValue("key", "value");
        }

        return new CustomerController(clock, configuration);
    }
}
```

It's now clear to see that we're testing what happens when the configuration dependency throws an exception.
The value of the current time is irrelevant so the clock has been removed from the test body.

### 6. Helper methods for assertions

If we use helper methods at the top of the test to help with test setup, why not do the same with the assertions?

For example, consider the following two tests which check the output of an ASP.NET Core controller method. Which is more readable?

```c#
public class CustomerControllerTests
{
    [Test]
    public void Get_customers_endpoint_returns_HTTP_status_code_200_OK()
    {
        var controller = new CustomerController();

        var actionResult = controller.GetAllCustomers();

        Assert.That(actionResult, Is.InstanceOf<OkResult>().Or.InstanceOf<OkObjectResult>());
    }

    [Test]
    public void Get_customers_endpoint_returns_HTTP_status_code_200_OK()
    {
        var controller = new CustomerController();

        var actionResult = controller.GetAllCustomers();

        AssertResponse.Is200Ok(actionResult);
    }
}
```

I don't know about you, but I reckon the second is much clearer.

Again, the main principle at play here is that I want to make the test as readable as possible.
Once you're looking at the body of the test, your audience is most likely developers rather than product owners, so you can include developer-specific language at this level.

The danger with this is that extracting helper methods for assertions might mask poor decisions about the API of your production code.
In this case we're working with the ASP.NET Core framework so there's nothing we can do about the API, but it's always worth considering whether you should improve the API rather than creating an assertion helper.

## Conclusion

I'll state my big principle again: ***make your automated tests easy to read***.

One thing to bear in mind is that the heuristics for what makes good test code are slightly different from production code.
For example, I would favour readability over reducing duplication in test code.
If the setup, action and assertions are almost the same in two tests, I would *not* extract a shared function with parameters, because I'd rather make it clear to the reader of the test method itself what is being checked.

Not all of these techniques will be useful in every situation, but they're all worth having in your locker to be brought out when needed.

Are there any other techniques you use to make your tests easier to read? Let me know!

## Appendix: longer example

[This GitHub Gist](https://gist.github.com/djcarter85/9246954d4ccc52f461100cdd323107dc) is extracted from a football predictions game I and a few friends have been playing.

The core code for calculating the standings for a particular round had some tests but I didn't like them, so I spent a good 30 minutes a while back improving them using some of the techniques outlined in this article.

I think you'll agree that what I've ended up with is a lot better than what I started with!
It's now so much easier to understand what the production code does and to be certain which aspects of its behaviour are being checked.