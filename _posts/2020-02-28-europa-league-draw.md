---
title: "Europa League Draw"
summary: "What is the chance of two British teams meeting in the Europa League last 16?" 
---

Yesterday evening I was watching [Arsenal play Olympiakos in the UEFA Europa League](https://www.bbc.co.uk/sport/football/51623263).
Part way through the first half, the commentator mentioned that five British teams might win their matches and make it through to the last 16.
He then went on to say that, if this were to occur, there would be a more than 50-50 chance of two British teams facing each other in the next round.

Now, [Peter Drury is an excellent commentator](https://www.youtube.com/watch?v=rZG0DX0U0Bs), but I have no way of rating his abilities as a mathematician, so I thought I'd verify this for myself.
At the very least it gave me something to do during half-time!

There are two ways of calculating the probability: we can calculate it mathematically or we can use a computer to simulate the draw.
Let's try both ...

## Maths

First off, a quick equation that will prove useful later on.
Suppose we have $$2n$$ teams which need to be drawn into $$n$$ fixtures.
How many distinct possible sets of fixtures are there?

Well, there are $$(2n)!$$ orders in which the teams can be pulled out of the hat, each of which gives us a fixture list by pairing off teams as they are drawn.
But for a given draw order we can we can swap the teams within each pair ($$2^n$$ ways) and permute the pairs ($$n!$$ ways), and it will give us the same fixture list.

So there are $$(2n)!/(2^n \times n!)$$ distinct fixture lists.

Let's apply this to the Europa League draw. There are 8 fixtures, so $$16!/(2^8 \times 8!)$$ distinct sets of fixtures. Of these, how many **don't** result in an all-British tie?

Each of the British teams would need a non-British team to play against; there are $$11 \times 10 \times 9 \times 8 \times 7$$ ways of choosing these.
Then there are 3 fixtures involving the remaining 6 non-British teams; there are $$6!/(2^3 \times 3!)$$ ways of choosing these (using our equation from earlier).

This comes out as $$11!/(2^3 \times 3!)$$ distinct sets of fixtures with no all-British ties.

Dividing one by the other and cancelling (I had a lot of crossing out to do), the probability of no all-British ties comes out as $$16/39 = 41.03\%$$ (or a **58.97%** chance of at least one match between two British teams).

## [Simulation](https://youtu.be/__G4RrlGmVk?t=71)

I did [something similar during last year's Champions League]({% post_url 2019-03-14-champions-league-draw %}), and so I've modified the code from last time [on a separate branch](https://github.com/djcarter85/ChampionsLeagueDraw/tree/europa-league-draw).

The results are as follows:

```
Simulating 100,000,000 fixture lists ...
Fixture lists with 0 all-British matches: 41,024,061 (41.02%)
Fixture lists with 1 all-British match: 51,282,524 (51.28%)
Fixture lists with 2 all-British matches: 7,693,415 (7.69%)
```

This gives us a **58.98%** chance of at least one all-British tie.

## Conclusion

So what is the probability of two British teams meeting in the Europa League?
The maths says **58.97%**; my computer says **58.98%**.

Firstly, it's nice to see the two line up (within a small error).
But secondly, it turns out the hypothesis was true!
It would have been more likely than not (with odds of about 3 to 2) for two British teams to meet in the last 16.

Alas, despite Peter Drury's optimism, only three British teams made it through (unfortunately not including my beloved Arsenal 😢).
The probability of [today's draw](https://www.bbc.co.uk/sport/football/51674681) actually having contained an all-British tie is left as an exercise for the reader!