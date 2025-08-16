---
title: "Shared birthdays, revisited"
summary: How do you sample from a non-uniform distribution?
---

In [my last post](/2025/08/07/birthdays) I described how I estimated the
probability of three people from a group of 71 sharing a birthday within a given
nine days. One of the assumptions I made was that birthdays are uniformly
distributed throughout the year. Although close, this is not true!

In this post I'd like to revisit that assumption and use the true distribution
of birthdays throughout the year, and see whether that changes my results. Along
the way we'll discover a clever algorithm for sampling from a weighted
distribution.

## Getting the data

The Office for National Statistics (ONS) has published [an article showing the
distribution of birthdays over a 20-year
period](https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/livebirths/articles/howpopularisyourbirthday/2015-12-18).
It's quite an interesting read (at least, I found it interesting!) and it shows
how more babies are born in late September than any other time of the year.

It also contains a link to the raw data (as a CSV file), showing the average
number of births for each date in that time period. This isn't quite what I need
for two reasons:

1. The algorithm I'm going to use needs integer weights, and most of the
   averages are decimal numbers.
2. The leap day (29 February) has been adjusted for the fact it only occurs once
   every four years (so that the averages are comparable).

So I multiplied the numbers from the raw data by the number of times the date
occurred in the period (5 times for the leap day, 20 times for every other date)
to get the total number of births by date. These are all integers, so can be
used in my algorithm. I've put the results in a [CSV
file](https://github.com/djcarter85/ProcGenFun/blob/birthdays-revisited/ProcGenFun/BirthdayWeights.csv),
should you wish to take a look.

## Example

If you're anything like me, then the best way to understand an algorithm is with
an example. Suppose we want to sample from the following weighted distribution.

Value | Weight
---|---
A | 5
B | 2
C | 1
D | 3
E | 1

We can visualise this with a bar chart, where each bar's width represents the
weight given to that value.

![Bar chart showing relative weights for each
value](/assets/images/2025-08-25-birthdays-revisited/graph-00.svg)

## Rejection sampling

Looking at this graph, we can quite quickly come up with an algorithm for
sampling from this distribution:

1. Randomly choose a cell from the 2D grid, using a uniform distribution.
2. If the cell is covered by a coloured bar, return the value corresponding to
   that bar.
3. Otherwise, start from step 1 again.

This technique is known as _rejection sampling_, as we reject any empty cells.
It's a simple approach; however, if most weights are a lot smaller than the
maximum, then there's lots of blank space on the grid and you end up rejecting
lots of values. Hence it can be very inefficient.

## A better approach

After some more research I came across an algorithm which doesn't have this
problem. The general idea is to move parts of some of the coloured bars around
so that you have a 2D grid which is completely covered. That way, you only have
to pick a cell once.

We can work out how wide the 2D grid needs to be by looking at the average
weight. In our case the average weight is 2.4 (shown with a vertical red line
below).

![Bar chart showing relative weights for each value along with average
weight](/assets/images/2025-08-25-birthdays-revisited/graph-01.svg)

To avoid any issues with floating point rounding errors, we're going to scale up
the weights so that the average is an integer. In our example we need to
multiply each weight by 5, making the total weight 60 and the average 12.

![Bar chart showing scaled-up weights for each
value](/assets/images/2025-08-25-birthdays-revisited/graph-02.svg)

What we're going to do is fill up the blank space in an "underfull" row (one
with weight lower than average) with some or all of the weight from an
"overfull" row (one with weight higher than average). We repeat until each row
is exactly full (its weight is equal to the average).

In our case, rows A and D are overfull and rows B, C and E are underfull. Let's
pick D (overfull) and E (underfull). There's a blank space of width 7 in row E
(12-5), so we transfer 7 across from row D to row E. This reduces the weight in
row D to 8 (15-7).

![Bar chart showing weights after one
step](/assets/images/2025-08-25-birthdays-revisited/graph-03.svg)

Row E is now full up, but there is still some blank space on the grid, so we go
again. The only overfull row is A (25) and let's pick underfull row D (8). Row D
has space for 4, so we transfer 4 from row A to row D, leaving row A with weight
21.

![Bar chart showing weights after two
steps](/assets/images/2025-08-25-birthdays-revisited/graph-04.svg)

Rinse and repeat. This time we move 7 from row A to row C.

![Bar chart showing weights after three
steps](/assets/images/2025-08-25-birthdays-revisited/graph-05.svg)

And then the final step is to move 2 from row A to row B.

![Bar chart showing final
weights](/assets/images/2025-08-25-birthdays-revisited/graph-06.svg)

At this point, each row has a width of exactly 12, made up of either one or two
values. The weight of each value (A-E) hasn't changed (all we did was move some
of the blocks around), and so this distribution is identical to the one we
started with.

In order to sample from this distribution, we pick a cell on the grid
(uniformly) and then return the value covered by that cell. We can do this by
first picking a row, and then picking from within the available values in that
row, based on the relative weightings in that row. So, for example, suppose we
randomly pick row C; then we'd pick C with probability 5/12 and A with
probability 7/12.

In this way we've reduced the problem of sampling from an arbitrarily-big
weighted distribution into sampling from two simpler distributions:

- a uniform distribution (to choose the row), and
- a weighted distribution of one or two values (to choose the value within the
  chosen row).

The latter is either a singleton or a
[Bernoulli](https://en.wikipedia.org/wiki/Bernoulli_distribution) distribution,
both of which are very easy to implement.

This algorithm is known as the _alias method_, because the blank space in each
row is "aliased" to return a different value.

## Implementation

Now let's look at how I implemented this in code. You can find the full thing on
the [`birthdays-revisited` branch in the ProcGenFun
repo](https://github.com/djcarter85/ProcGenFun/tree/birthdays-revisited), should
you wish to take a look.

To start with, we need a data structure to store a value and its associated
weight. For this I've created a simple record.

```cs
public record Weighting<T>(T Value, int Weight);
```

We're going to end up with a function which takes in a collection of these
weightings and returns a distribution matching those weightings. For this I've
added a new class and method.

```cs
public static class WeightedDiscreteDistribution
{
    public static IDistribution<T> New<T>(IEnumerable<Weighting<T>> weightings)
    {
        // Implementation goes here ...
    }
}
```

The first job is to normalise the weights.

```cs
var unnormalisedWeightings = weightings.ToList();

// We need the average weight to be an integer. One way to guarantee
// this is to scale each weight by the number of weights in the list.
// It would be possible (but more complicated) to work out a smaller
// number to scale by in some situations.
var scaleFactor = unnormalisedWeightings.Count;

var normalisedWeightings = unnormalisedWeightings
    .Select(w => w with { Weight = w.Weight * scaleFactor })
    .ToList();

var averageWeight = unnormalisedWeightings.Sum(w => w.Weight);
```

Then we need to set up two collections for the under/overfull rows ...

```cs
var underfullWeightings = new Stack<Weighting<T>>();
var overfullWeightings = new Stack<Weighting<T>>();
```

... and a collection to store the distributions for each row.

```cs
var distributions = new List<IDistribution<T>>();
```

The list of distributions only ever gets added to, so I've made it a list. The
under/overfull collections have items added and removed throughout the process,
so a stack seems more appropriate.

We'll need a function which categorises a given weighting into one of these
collections.

```cs
void CategoriseWeighting(Weighting<T> weighting)
{
    if (weighting.Weight < averageWeight)
    {
        underfullWeightings.Push(weighting);
    }
    else if (weighting.Weight > averageWeight)
    {
        overfullWeightings.Push(weighting);
    }
    else
    {
        distributions.Add(Singleton.New(weighting.Value));
    }
}
```

We start by categorising all of the weightings.

```cs
foreach (var weighting in normalisedWeightings)
{
    CategoriseWeighting(weighting);
}
```

And then the bulk of the work is done within a loop, transferring weight to
gradually fill up the underfull rows.

```cs
while (underfullWeightings.Any())
{
    // "Under" and "over" refer to the average weight. So if there
    // is an underfull weighting there must be an overfull
    // weighting too.
    var underfullWeighting = underfullWeightings.Pop();
    var overfullWeighting = overfullWeightings.Pop();

    var transferredWeight = averageWeight - underfullWeighting.Weight;
    finalDistributions.Add(
        CreateBernoulliByWeights(
            underfullWeighting,
            overfullWeighting with { Weight = transferredWeight }));

    var adjustedWeight = overfullWeighting.Weight - transferredWeight;
    CategoriseWeighting(
        overfullWeighting with { Weight = adjustedWeight });
}
```

Once we've done this we simply need to return a distribution which, when
sampled, samples uniformly from the rows available and then samples from the
distribution for the chosen row.

```cs
return
    from dist in UniformDistribution.Create(distributions)
    from value in dist
    select value;
```

It's nice to see how the abstractions we have created so far (and which are
available to us via the RandN package) help us to create new distributions out
of existing ones! If you want to look at the whole thing, it's on the
[`birthdays-revisited` branch in the ProcGenFun
repo](https://github.com/djcarter85/ProcGenFun/tree/birthdays-revisited).

## Results

I've tested out my general function here using the example I walked through
earlier. Sampling many times from the generated distribution, here's what I
ended up with.

Value | Weight | Probability | Actual proportion of samples
--- | --- | --- | ---
A | 5 | 41.67% | 41.86%
B | 2 | 16.67% | 16.46%
C | 1 | 8.33% | 8.38%
D | 3 | 25% | 24.99%
E | 1 | 8.33% | 8.30%

With results like these, I'm reasonably confident this is working as expected!

Now for the moment of truth. I loaded in the weights for birthdays throughout
the year and then ran the same simulations from the previous post. Here are my
results:

Scenario | Probability estimate (uniform distribution of birthdays) | Probability estimate (true distribution of birthdays)
--- | --- | ---
23 people, 2 people share a birthday | 50.71% | 50.71%
71 people, 2 people share a birthday | 99.93% | 99.93%
71 people, 2 people share a birthday on camp | 13.97% | 14.45%
71 people, 3 people share a birthday | 31.61% | 31.71%
71 people, 3 people share a birthday on camp | 0.93% | 0.98%

In summary, using the true distribution of birthdays doesn't change the results
very much at all. It seems that assuming a uniform distribution of birthdays
throughout the year was not a bad assumption to make!

## Further reading

If you'd like to learn more, I recommend the following articles.

- Eric Lippert has written a series of blog posts on representing probability
  distributions, called _Fixing Random_. Posts
  [8](https://ericlippert.com/2019/02/26/fixing-random-part-8/) and
  [9](https://ericlippert.com/2019/02/28/fixing-random-part-9/) in the series
  are about the alias method, and formed the basis of my implementation in this
  article.
- The [Wikipedia article on the alias
  method](https://en.wikipedia.org/wiki/Alias_method) gives a good explanation
  of the algorithm.
