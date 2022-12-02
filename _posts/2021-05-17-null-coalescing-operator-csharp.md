---
title: "The C# null-coalescing operator"
summary: A mathematical analysis of C#'s <code>??</code> operator.
---

Recently I have had cause to analyse the mathematical properties of C#'s
[null-coalescing
operator](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/null-coalescing-operator)
(`??`). If you're wondering what kind of wacky and fun-filled life I lead, then
read on&nbsp;...

The null-coalescing operator takes in two arguments, and returns the first one
unless it's `null`, in which case it returns the second one. That is, if you
have two variables `a` and `b` of type `T`, then the statement `T x = a ?? b;`
is equivalent to the following:

```c#
T x;
if (a != null)
{
    x = a;
}
else
{
    x = b;
}
```

Using this operator can be a really succinct way of expressing concepts
involving `null`s in code.

For example, recently I've been working on some code which parses XML into more
structured types. The XML can take many different (valid) forms, and so there
are dozens of different types that could be returned. Currently, the code looks
something like this:

```c#
XElement fileContents = // Import from file ...

return GetFormat1OrNull(fileContents) ??
    GetFormat2OrNull(fileContents) ??
    GetFormat3OrNull(fileContents) ??
    GetFormat4OrNull(fileContents) ??
    GetFormat5OrNull(fileContents);
```

In my case, the definition of what constitutes the different formats is a little
vague, and I'd like to refactor to group them differently. In order to do this,
I needed to verify two mathematical properties of the `??` operator.

## Maths

In mathematics, a **binary operator** is a function which takes two inputs
(hence "binary") and returns one output. These are all over the place in coding;
examples in C# include:

- `+`, `-`, `*` and `/`, which input two numbers and output a number
- `==`, which input any two types and outputs a boolean
- `<`, `<=`, `>` and `>=`, which input two numbers and output a boolean
- (yes, you guessed it) `??`, which inputs two of the same type and outputs that
  type.

A binary operator is called **associative** if it doesn't matter where you put
the brackets when you apply the operator twice. For example, `(a + b) + c` and
`a + (b + c)` are always the same; this makes `+` associative. This is helpful
when writing things down because it means you can just leave out the brackets:
`a + b + c`. [Note: this only makes sense when the operator inputs and outputs
the same type.]

A binary operator is called **commutative** if it doesn't matter which order you
write the inputs. For example, `a + b` and `b + a` are always the same; this
makes `+` commutative.

You can easily find examples of operators with and without these properties;
e.g. `-` is neither associative or commutative (try it out!).

## Application to my code

It turns out that `??` is associative (proof at the end of this post).

This is really helpful, because it means that I can change the way that the
different formats are grouped together by clever use of brackets. Once I've done
that I can extract methods for groupings of formats that make sense together.

Unfortunately it turns out that `??` is not commutative, because the order
matters in the case when both arguments are not null (again, see the end of this
post for a proof).

However, in my case the different formats are mutually exclusive; that is, the
incoming XML can match at most one of the valid formats. This means that I *can*
treat the `??` as commutative, because there is never a situation where the XML
matches multiple formats.

This means that if I wanted to group formats 2 and 4, I could first reorder 3
and 4 (by commutativity) and then group 2 and 4 (by associativity).

## Conclusion

This is just one of many ways in which the mathematical theory behind
programming helps you to refactor. Understanding the maths helps you to tell
whether a change you've made is a genuine refactor or whether it might break the
code.

Breaking up a refactor into lots of small steps, each of which can be proven not
to break anything, is a very useful way of improving the quality of your code.
It's also very satisfying!

## Appendix: proofs

See below a proof that `??` is associative.

| `A` | `B` | `C` | `(A ?? B) ?? C` | `A ?? (B ?? C)` |
|---|---|---|---|---|
|`null`|`null`|`null`|`(null ?? null) ?? null`<br/>= `null ?? null`<br/>= `null`|`null ?? (null ?? null)`<br/>= `null ?? null`<br/>= `null`|
|`null`|`null`|`C`|`(null ?? null) ?? C`<br/>= `null ?? C`<br/>= `C`|`null ?? (null ?? C)`<br/>= `null ?? C`<br/>= `C`|
|`null`|`B`|`null`|`(null ?? B) ?? null`<br/>= `B ?? null`<br/>= `B`|`null ?? (B ?? null)`<br/>= `null ?? B`<br/>= `B`|
|`null`|`B`|`C`|`(null ?? B) ?? C`<br/>= `B ?? C`<br/>= `B`|`null ?? (B ?? C)`<br/>= `null ?? B`<br/>= `B`|
|`A`|`null`|`null`|`(A ?? null) ?? null`<br/>= `A ?? null`<br/>= `A`|`A ?? (null ?? null)`<br/>= `A ?? null`<br/>= `A`|
|`A`|`null`|`C`|`(A ?? null) ?? C`<br/>= `A ?? C`<br/>= `A`|`A ?? (null ?? C)`<br/>= `A ?? C`<br/>= `A`|
|`A`|`B`|`null`|`(A ?? B) ?? null`<br/>= `A ?? null`<br/>= `A`|`A ?? (B ?? null)`<br/>= `A ?? B`<br/>= `A`|
|`A`|`B`|`C`|`(A ?? B) ?? C`<br/>= `A ?? C`<br/>= `A`|`A ?? (B ?? C)`<br/>= `A ?? B`<br/>= `A`|

See below a proof that `??` is commutative except when both values are not null.

| `A` | `B` | `A ?? B` | `B ?? A` |
|---|---|---|---|
| `null` | `null`| `null` | `null` |
| `null` | `B`| `B` | `B` |
| `A` | `null`| `A` | `A` |
| `A` | `B`| `A` | `B` |
