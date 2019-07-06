---
title: Champions League Quarter-Final Draw
summary: What are the chances of English teams avoiding each other in the Champions League quarter-final draw?
---

Last night, [Liverpool beat Bayern Munich 3-1](https://www.bbc.co.uk/sport/football/47543631) in the UEFA Champions League round of 16. This means that, of the eight teams left in the competition, exactly half are English ([for the first time since 2008-09](https://twitter.com/OptaJoe/status/1105950279642636294)). As a result, the British media has got very excited about the possibility of an English team winning it this year (for the first time since 2012 when Chelsea beat Bayern Munich on penalties in the final).

The draw for the quarter-finals is on Friday. If all the English teams draw each other, then we're guaranteed two English teams in the semi finals, but it also means there's no chance of all four progressing. If they all avoid each other, then they might all make it to the semi-finals or none of them might.

Now, I'm no bookie, so I'm not going to give you odds on the outcomes of the matches. However, the draw is entirely random, so as a mathematician/programmer I feel qualified to throw in my two cents ...

From an anglo-centric point of view, there are three mutually exclusive outcomes of the quarter-final draw:

- zero all-English ties (each match is between an English team and a non-English team)
- one all-English ties (and the other two English teams play non-English opposition)
- two all-English ties

What is the probability of each?

## Maths

First off, how many different sets of fixtures are there?

The draw works by pulling the teams out of a bag at random, and then pairing them off in twos to decide the fixtures. There are $$8!$$ ways to order the remaining 8 teams, but some of the resultant fixture lists will be the same. Each pair of two teams can be ordered either way ($$2^4$$ ways), and then the pairings can be reordered in the list ($$4!$$ ways). This means that each fixture list could have come from $$2^4 \times 4!$$ different orderings, so the number of fixture lists is $$8!/(2^4 \times 4!) = 105$$.

How many of these fixture lists give zero all-English ties?

Well, this means the English teams play in different fixtures, so all we need to do is consider the number of ways of rearranging the four non-English teams. This is $$4! = 24$$.

How many of these fixture lists give two all-English ties?

In this case, we can split the 8 teams into two pots (English and non-English teams) and then work out how many possible fixture lists there are. For each pot, there are 3 ways to choose the ties, so there are $$3 \times 3 = 9$$ fixture lists that satisify this.

The remainder, 72, have exactly one all-English tie.

As probabilities, this gives:

- a 22.86% chance of zero all-English ties
- a 68.57% chance of exactly one all-English tie
- an 8.57% chance of two all-English ties

## Simulation

The alternative to working out the probabilities is to let a computer simulate the draw a large number of times and look at the results. This is known as the [Monte Carlo method](https://en.wikipedia.org/wiki/Monte_Carlo_method). We'll never get the exact probabilities this way, but it can be really useful if we're dealing with a problem so big that evaluating the probabilities mathematically is infeasible.

The source code for how I did this can be found at [https://github.com/djcarter85/ChampionsLeagueDraw](https://github.com/djcarter85/ChampionsLeagueDraw), but there's a summmary below.

I started off with a `Team` class, adding the attributes that were necessary for this problem.

##### C#
```c#
public class Team
{
    public Team(string name, bool isEnglish)
    {
        Name = name;
        IsEnglish = isEnglish;
    }

    public string Name { get; }

    public bool IsEnglish { get; }
}
```

Then I added a simple `Match` class, containing a property for calculating the information we are interested in, namely whether the match contains two English teams.

##### C#
```c#
public class Match
{
    public Match(Team home, Team away)
    {
        Home = home;
        Away = away;
    }

    public Team Home { get; }

    public Team Away { get; }

    public bool IsAllEnglish => this.Home.IsEnglish && this.Away.IsEnglish;
}
```

Then the simulation is mainly done in the `FixtureList` class.

##### C#
```c#
public class FixtureList
{
    private static readonly IReadOnlyList<Team> Teams = new[]
    {
        new Team("Tottenham Hotspur", true),
        new Team("Ajax", false),
        new Team("Manchester United", true),
        new Team("FC Porto", false),
        new Team("Manchester City", true),
        new Team("Juventus", false),
        new Team("Barcelona", false),
        new Team("Liverpool", true),
    };

    private FixtureList(IReadOnlyList<Match> matches)
    {
        Matches = matches;
    }

    public IReadOnlyList<Match> Matches { get; }

    public int NumberOfAllEnglishMatches => this.Matches.Count(m => m.IsAllEnglish);

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

I'm using the [MoreLINQ](https://github.com/morelinq/MoreLINQ) extension methods `Shuffle` and `Batch` here.

Then it's a case of running this a large number of times and collating the results. Here's what I found with 100,000,000 simulations:

##### Output
```
Simulating 100,000,000 fixture lists ...
Fixture lists with 0 all-English matches: 22,851,251 (22.85%)
Fixture lists with 1 all-English match: 68,576,647 (68.58%)
Fixture lists with 2 all-English matches: 8,572,102 (8.57%)
Time taken: 402.14s
```

## Summary

Here's a summary of the calculated and simulated results:

|Number of all-English matches|Calculated|Simulated|
|---|---|---|
|0|22.86%|22.85%|
|1|68.57%|68.58%|
|2|8.57%|8.57%|

Not bad! Our simulated values were almost identical to those we'd calculated.

In this case, we could calculate the exact probabilities, so the simulation wasn't entirely necessary. But it's useful to know how to perform these sorts of simulations, because often the problem at hand is so complicated that calculating it by hand won't work.

Whether or not an English team brings home the Champions League trophy, we now all know a little more about tomorrow's quarter final draw. It's coming home ...
