---
title: Champions League Draw, Revisited
summary: How do you deal with randomness in .NET code?
---

Over the last couple of months, Eric Lippert has written a series of
blog posts explaining how best to deal with randomness in .NET code ([starting here](https://ericlippert.com/2019/01/31/fixing-random-part-1/)).

His main argument is that the standard .NET API for randomness is not very
good, and he goes on to describe how to write code involving randomness in
a much cleaner and more understandable way.

The motivation behind this is great. First off, he's totally right;
the standard .NET API for random number generation is a bit naff.
But also, as machine learning and genetic algorithms become more and
more prevalent in the way we use computers to solve problems, being able
to express stochastic algorithms clearly in code is only going to become
more important as time goes on.

A while back I wrote an article about simulating the Champions League
quarter-final draw. This obviously involved a source of randomness,
so I thought it would be interesting to revisit my code and see if
I can improve it by using some of the ideas from Eric Lippert’s posts.

I’ve put the code for this article on
[a separate branch in the original repository](https://github.com/djcarter85/ChampionsLeagueDraw/tree/distributions).

## The `IDistribution<T>` interface

Lippert's fundamental abstraction is that of a **distribution**:
a source of random values of a given type.
This is modelled using a simple interface:

```c#
public interface IDistribution<T>
{
    T Sample();
}
```

From this, we can start with simple implementations of the interface and
combine them to make more complicated ones. For example, the
[standard continuous uniform distribution](https://github.com/ericlippert/probability/blob/episode03/Probability/StandardContinuousUniform.cs),
which returns real values satisfying $$0 \leq x < 1$$, or the
[singleton distribution](https://github.com/ericlippert/probability/blob/episode04/Probability/Singleton.cs),
which always returns the same value.

Such abstractions and implementations could be put into a small class library;
I wouldn't be surprised to see one appear on NuGet in the near future.

Lippert also defines an extension method for producing a stream of samples,
of which I have made a modified version to remove the infinite loop:

```c#
public static class DistributionExtensions
{
    // Lippert's extension method
    public static IEnumerable<T> Samples<T>(this IDistribution<T> distribution)
    {
        while (true)
        {
            yield return distribution.Sample();
        }
    }

    // Modified version to avoid infinite loop
    public static IEnumerable<T> TakeSamples<T>(this IDistribution<T> distribution, int numberOfSamples)
    {
        for (var i = 0; i < numberOfSamples; i++)
        {
            yield return distribution.Sample();
        }
    }
}
```

## Recap

The main class in my previous implementation of the problem was the
`FixtureList` class, an abbreviated version of which is shown below.

```c#
public class FixtureList
{
    private static readonly IReadOnlyList<Team> Teams = ...

    private FixtureList(IReadOnlyList<Match> matches)
    {
        ...
    }

    ...

    public static FixtureList CreateRandom()
    {
        var matches = Teams
            .Shuffle()
            .Batch(2)
            .Select(batch => new Match(batch.ElementAt(0), batch.ElementAt(1)))
            .ToArray();

        return new FixtureList(matches);
    }
}
```

The only random part of this is the call to `.Shuffle()`, a method from the
[MoreLINQ library](https://github.com/morelinq). Everything else is
deterministic.

This is then used in my program's main method as follows:

```c#
public static class Program
{
    private static readonly IDistribution<FixtureList> Distribution = new FixtureListDistribution();

    // ...

    public static void Main(string[] args)
    {
        // ...

        foreach (var index in Enumerable.Range(0, totalNumberOfFixtureLists))
        {
            var fixtureList = FixtureList.CreateRandom();

            // Collate results ...
        }

        // ...
    }
}
```

## Let's make some changes ...

The first thing to notice is that the `CreateRandom()` method has exactly
the right signature for an implementation of `IDistribution<FixtureList>`.
So that was pretty easy to extract:

```c#
public class FixtureListDistribution : IDistribution<FixtureList>
{
    private static readonly IReadOnlyList<Team> Teams = ...

    public FixtureList Sample()
    {
        var matches = Teams
            .Shuffle()
            .Batch(2)
            .Select(batch => new Match(batch.ElementAt(0), batch.ElementAt(1)))
            .ToArray();

        return new FixtureList(matches);
    }
}
```

The call site then changes to:

```c#
public static class Program
{
    private static readonly IDistribution<FixtureList> Distribution = new FixtureListDistribution();

    // ...

    public static void Main(string[] args)
    {
        // ...

        foreach (var fixtureList in Distribution.TakeSamples(totalNumberOfFixtureLists))
        {
            // Collate results ...
        }

        // ...
    }
}
```

But we can go further: rather than using `Shuffle()` from MoreLINQ,
where we have no control over the implementation nor the source of randomness,
we can implement our own `ShuffleDistribution` using the
[Fisher-Yates method](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle).

```c#
public class ShuffleDistribution<T> : IDistribution<IReadOnlyList<T>>
{
    private readonly IReadOnlyList<T> source;

    public ShuffleDistribution(IReadOnlyList<T> source)
    {
        this.source = source;
    }

    public IReadOnlyList<T> Sample()
    {
        var array = this.source.ToArray();

        var totalNumberOfItems = array.Length;

        for (var index1 = 0; index1 < totalNumberOfItems; index1++)
        {
            var randomIndex2 = StandardDiscreteUniform.Distribution(index1, totalNumberOfItems - 1).Sample();
            SwapItemsAtIndexes(array, index1, randomIndex2);
        }

        return array;
    }

    private static void SwapItemsAtIndexes(IList<T> array, int index1, int index2)
    {
        var item1 = array[index1];
        var item2 = array[index2];

        array[index1] = item2;
        array[index2] = item1;
    }
}
```

[Shout out to [this blog post by DataGenetics](http://datagenetics.com/blog/november42014/index.html),
which was really helpful in improving my understanding of shuffling algorithms.]

The simple distributions that this is based on (e.g. `StandardDiscreteUniform`)
were taken from Eric Lippert's blog posts, as is his implementation of a source
of randomness with higher precision.

## Reflections

Having played around with this a little, my overwhelming response is a
positive one! Writing understandable code is all about creating the right
abstractions, and the `IDistribution<T>` interface is a simple abstraction
that makes it easy to write code that uses randomness in some way.

If you wanted to test code that uses a random value, the `IDistribution<T>`
interface might be the right interface to inject as a dependency which you
could mock out for unit testing. However, in some cases I could see that you might
need to introduce another interface; for example, if testing code that requires
a random integer up to a maximum value, the following interface might be
helpful for mocking purposes:

```c#
public interface IIntegerDistribution
{
    int Sample(int upperBound);
}
```

If you wanted to unit test an implementation of a distribution,
I think there are some tricky obstacles to overcome. The whole point of
a distribution is that the value that comes backfrom it is random.
How can you test against a hard-coded expected outcome?

Perhaps you could take 1000 samples (or some other large number) and check 
that the values returned correspond to the expected distribution. In this case,
you'd have to give some sort of tolerance that the distribution must fall
within for the test to pass.
How do you choose that tolerance? Too small and the test will frequently fail;
too large and there's a high chance of the test passing even if the code is wrong.
Is it acceptable for the test to simply fail sometimes because of random chance?

Another way to tackle this problem would be to inject any dependent
distributions into the class under test. The problem with this is that the
tests would be heavily dependent on the implementation. For example, suppose
you wanted to test a distribution which returns heads or tails with equal
probability, and depends on the standard continuous uniform distribution as
its underlying source of randomness. There's nothing canonical about which
values betwen 0 and 1 correspond to which outcome, and so as soon as you
write a test, you're tying yourself into a particular implementation! Your
test might fail even though the distribution is working perfectly fine.

I suspect the best way to implement any distributions is to rely on a base
source of randomness (e.g. 
[Lippert's `BetterRandom` implementation](https://ericlippert.com/2019/02/04/fixing-random-part-2/))
and use well-known algorithms (for example, 
[see here](https://en.wikipedia.org/wiki/Pseudo-random_number_sampling))
to produce the random values.
You would then forego unit testing entirely, and focus on unit testing
the code which samples from your distributions, which is where your complicated
(and therefore potentially error-prone) business logic is likely to be.

If you have any insights on this, [get in touch](/About)!