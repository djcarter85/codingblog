---
title: Test doubles
summary: How to test software components in isolation.
---

It's often important to be able to test software components in isolation.

The components we want to test vary widely in terms of size and complexity, from
methods and classes up to microservices and entire systems.

If we want to test a component (A) which depends on another component (B), then
we might consider replacing component B with a **test double**. A test double is
any kind of replacement for a dependency which exists solely for the purposes of
testing. This enables us to focus on testing component A without needing to
worry about how component B works.

![Component A depends on Component B](/assets/images/2022-12-02-test-doubles/image-1.png)

In this example, component A is often called the **system under test (SUT)**,
and component B is sometimes called the **depended-on component (DOC)**. I'll
use these terms in the rest of this article.

![The SUT depends on the DOC](/assets/images/2022-12-02-test-doubles/image-2.png)

The term "test double" is typically attributed to Gerard Meszaros in his book
[_XUnit Test Patterns_](https://www.amazon.co.uk/dp/0131495054). The analogy
comes from film-making. When filming action scenes, it's typically not desirable
for the real actor to perform stunts (perhaps it's dangerous, or the actor
doesn't have the required skills), so a "stunt double" who looks like the real
actor is used instead. In the same way, when testing the SUT it may not be
desirable to use the real DOC (perhaps it's difficult to configure correctly, or
it would introduce unwanted side effects), so a "test double" which looks like
(i.e. has the same interface as) the real DOC can be used instead.

In this article I'd like to list my understanding of some different types of
test double, and describe when each might be useful.

## Stub

A **stub** is a component with the same interface as the DOC which returns
hard-coded values.

For example, if the DOC is an authorizer class with a method called
`IsLoggedIn`, we might create a `StubAuthorizer` class which implements the
method by always returning `true`. This would enable us to verify the behaviour
of the SUT when the user is logged in, without having to actually log the user
in.

Typically only the operations required by the test are set up with return
values; other operations might simply fail fast if they are called.

## Spy

A **spy** is a stub which also records how it was used.

For example, we might create a `SpyAuthorizer` which, when `IsLoggedIn` is
called, sets a property called `IsLoggedInWasCalled` to `true`. That way, our
test can check that `IsLoggedIn` was called.

Another example at a higher level would be if the DOC is a third-party
email-sending service. We might write a spy which keeps a record of the emails
that were sent, so that we can check the emails sent by the SUT via the DOC.

## Mock

A **mock** is a spy which also has an expectation of how it should be used.

For example, we might create a `MockAuthorizer` which has a `Verify` method.
This method verifies that the `IsLoggedIn` method was called, and throws an
exception if not.

Using a mock is similar to using a spy and then asserting how it was used. The
difference is that the knowledge of how the double should have been used has
been moved from the test into the test double.

It's worth noting that the word "mock" is often used in a more general sense to
mean any kind of test double. For example, the popular [.NET Moq
library](https://github.com/moq/moq4) describes itself as a "mocking library",
when in actual fact it's often used to create stubs and spies, as well as mocks.
Purists tend to prefer the use of "double" for the general concept, and "mock"
for the specific type of double which knows what method calls to expect. This is
primarily because [the original paper introducing the notion of mock
objects](https://www2.ccs.neu.edu/research/demeter/related-work/extreme-programming/MockObjectsFinal.PDF)
defined the term "mock" in this way.

## Fake

A **fake** is a simulator for the DOC which has some real business behaviour.

For example, suppose the DOC is an API built by someone else that we have no
control over. We might build a fake version of that API so that when manually
testing the SUT we don't have to rely on the real API.

A fake is more sophisticated than a stub. For example, suppose the DOC allowed
you to create users and fetch a list of users. A stub would need both method
calls to be set up to return the right values, whereas a fake would store any
created users and return all created users when asked for them. In this way, a
fake emulates the DOC more closely.

Fakes can get quite complicated, so they might be more applicable when testing
at a high level (e.g. APIs rather than classes). They might end up needing unit
tests of their own.

## Dummy

A **dummy** is a component which is never used but is nevertheless required in
some way.

For example, if the SUT is a class whose constructor requires a
`DatabaseConnection` object, but we know that the method we're testing doesn't
connect to the database, we can pass in a dummy version of `DatabaseConnection`.

Sometimes `null` can be used as a dummy object; however in most cases you'll
need to create a real instance using inheritance (by sub-classing the DOC), or
by defining a method which creates the DOC with dummy values.

## Further reading

My understanding of these concepts comes from a number of sources, some of which
are listed below.

- Gerard Meszaros [defines a "test
  double"](http://xunitpatterns.com/Test%20Double.html) and gives some examples
  of the different types. His article goes into much more detail than mine!
- Robert C. Martin explains the different types of test doubles [in the form of
  a
  conversation](https://blog.cleancoder.com/uncle-bob/2014/05/14/TheLittleMocker.html).
- Martin Fowler gives [a summary of the different types of test
  double](https://martinfowler.com/bliki/TestDouble.html).
- Martin Fowler has another [article discussing the differences between mocks
  and stubs](https://martinfowler.com/articles/mocksArentStubs.html), and the
  differences between "classical" and "mockist" TDD philosophies.
- Mark Seemann [argues that stubs and mocks break
  encapsulation](https://blog.ploeh.dk/2022/10/17/stubs-and-mocks-break-encapsulation/),
  and suggests that fakes are to be preferred.
