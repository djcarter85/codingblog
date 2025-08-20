---
title: "Shared birthdays"
summary: What's the chance of three people sharing a birthday within a week?
---

Last week my wife and I were volunteering on a [Christian youth
camp](https://www.dorsetventure.org.uk/) in Studland, Dorset.

![Dorset Venture
campsite](/assets/images/2025-08-07-birthdays/dorset-venture.jpg)

If it's anyone's birthday during the week we like to celebrate it, and it turned
out that on one of the days it was the birthday of three people! This seemed
like an unlikely occurrence, so I decided to work out the chances of this
happening.

[Previously on this blog](/2019/03/14/champions-league-draw/) I've calculated
probabilities for an event like this using both maths (work out the exact
probability) and simulation (randomly run it lots of times and count how often
it occurs). In this case the maths seems very complicated, so I'm going to
estimate the probability using simulation.

Recently on this blog I've been investigating the interaction between randomness
and functional programming (in my series called [ProcGen
Fun](/2024/12/18/PGF-00/#list-of-posts)), with the fundamental concept being
that of a distribution. The code in this post builds on top of what I've already
done, and you can find the whole thing on [the `birthdays` branch in the same
repository](https://github.com/djcarter85/ProcGenFun/tree/birthdays).

_(NB: if you're not interested in the code, you can [skip straight to the
results](#results)!)_

## Birthday distribution

First off I need a way of selecting a single random birthday. In practice
[birthdays are not evenly distributed throughout the
year](https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/livebirths/articles/howpopularisyourbirthday/2015-12-18),
but for now let's assume they are and ignore leap years.

The simplest way to build a distribution of birthdays is to use a uniform
distribution of dates in the current year. I can do this by taking a uniform
distribution of numbers between 0 and 364 and adding that number of days to 1st
January.

```cs
public static IDistribution<LocalDate> BirthdayDist() =>
    from offset in Uniform.New(0, 365)
    select new LocalDate(2025, 01, 01).PlusDays(offset);
```

## Distribution of a set of birthdays

On our camp we had 71 people, and so to represent that I can sample from my
distribution 71 times. I've already written a method for this called `Repeat`,
so I'll use that.

```cs
public static IDistribution<IEnumerable<LocalDate>> BirthdaySetDist() =>
    BirthdayDist().Repeat(71);
```

## Checking for three people with the same birthday

I now need a way of determining whether a given set of 71 birthdays contains a
three-way shared birthday during the nine days of camp. To do this I can filter
the birthdays to only ones which occur during camp, and then see if there's a
group of three or more.

```cs
public static bool ThreePeopleShareBirthdayOnCamp(
    IEnumerable<LocalDate> birthdays) =>
    birthdays
        .Where(b =>
            b >= new LocalDate(2025, 07, 26) &&
            b <= new LocalDate(2025, 08, 03))
        .GroupBy(b => b)
        .Any(g => g.Count() >= 3);
```

## Estimating probabilities

In order to estimate the probability of a particular event within a certain
distribution, I can sample from the distribution a large number of times and
then count how many times the event occurs.

This is a very general idea so I've written a general method for it. Notice that
the return value is a distribution - this represents the fact that each time I
run the simulation I might get a different result. As it's only an estimate,
this is expected.

```cs
public static IDistribution<double> EstimateProbability<T>(
    this IDistribution<T> dist,
    Func<T, bool> predicate,
    int sampleCount) =>
    from samples in dist.Repeat(sampleCount)
    select (double)samples.Count(predicate) / sampleCount;
```

## Putting it all together

I have all the components I need, so it's now a case of putting them together.
I've chosen to run the simulation 1 million times; this is probably overkill,
but it only took around ten seconds to run on my computer.

```cs
var probabilityDist = Birthdays.BirthdaySetDist()
    .EstimateProbability(
        Birthdays.ThreePeopleShareBirthdayOnCamp,
        sampleCount: 1_000_000);

var rng = StandardRng.Create();

var probability = probabilityDist.Sample(rng);
```

## <a name="results"></a> Results

When I ran this it gave me a probability of **0.93%**. That is, you'd expect this to
happen only once every 107 years!

Now that I've got an initial working version of the code, I can make some
changes to find some related probabilities. For example:

- I can change the size of the group
- I can change the number of shared birthdays I'm looking for
- I can remove the restriction that the shared birthday must happen during camp
  (i.e. it counts even even if the shared birthday is at some other point in the
  year)

Here are some of the results I found for a group of 71 people:

- The chance of two people sharing a birthday (at any point in the year) is
  **99.93%** (i.e. virtually guaranteed).
- The chance of two people sharing a birthday during camp is **13.97%** (i.e. it'll
  happen once every 7 years or so).
- The chance of three people sharing a birthday (at any point in the year) is
  **31.61%** (i.e. it'll happen once every 3 years or so).

It's reasonably well-known that in a group of 23 people there's about a 50-50
chance that two of them will share a birthday (it's called the [birthday
paradox](https://en.wikipedia.org/wiki/Birthday_problem)). So as a final sanity
check of my calculations I ran it for 23 people and two shared birthdays, and,
sure enough, the result came out to 50.71%. Phew!
