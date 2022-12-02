---
title: A <code>Nullable&lt;T&gt;</code> is like a simple <code>IEnumerable&lt;T&gt;</code>
summary: An equivalence between two .NET types which comes in handy when refactoring.
---

Here's a fact about two .NET types:

> A `Nullable<T>` is equivalent to an `IEnumerable<T>` with either zero or one
> elements.

That is, suppose you have a variable `x` of type `Nullable<T>` for some value
type `T` (sometimes written `T?`). Then:

- If `x.HasValue` is `false`, then it's equivalent to an `IEnumerable<T>` with
  zero elements.
- If `x.HasValue` is `true`, then it's equivalent to an `IEnumerable<T>` with
  one element.

Note that this only works for value types, as `Nullable<T>` is only defined if
`T` is a value type. However, you could apply the same principle to reference
types, especially if you're using [nullable reference
types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/nullable-reference-types)
in C# 8 or newer.

This realisation came in handy recently when I was refactoring some code. Here's
a trimmed down example to explain how this is useful.

## Example

Suppose your code has a function which returns a nullable:

```c#
int? GetNullableNumber(string text)
{
    // The implementation of this method is less important than the return type
    if (int.TryParse(text, out int value))
    {
        return value;
    }
    else
    {
        return null;
    }
}
```

Then when you call it, it only makes sense to perform an action (e.g. saving to
a database) if the nullable has a value:

```c#
// Assume GetText() is defined elsewhere
var text = GetText();

var nullableNumber = GetNullableNumber(text);

// This condition could equivalently be written nullableNumber != null
if (nullableNumber.HasValue)
{
    var number = nullableNumber.Value;
    SaveNumberToDatabase(number);
}
```

Suppose you now want to support a `text` value that could contain multiple
numbers (perhaps comma-separated). To make this new functionality easier, we can
do an initial refactor like so:

```c#
IEnumerable<int> GetNumbers(string text)
{
    if (int.TryParse(text, out int value))
    {
        return new List<int>() { value };
    }
    else
    {
        return Enumerable.Empty<int>();
    }
}
```

And then the call site becomes:

```c#
var text = GetText();

var numbers = GetNumbers(text);

foreach (int number in numbers)
{
    SaveNumberToDatabase(number);
}
```

From here, we can go on to add the new parsing functionality to `GetNumbers()`.

## Conclusion

This works because of the fact we started with:

> A `Nullable<T>` is equivalent to an `IEnumerable<T>` with either zero or one
> elements.

To refactor from nullable to enumerable, replace any `HasValue` (or `!= null`)
checks with a `foreach`.

It's worth pointing out that I don't necessarily think that the `foreach` is
more readable; in fact, in the above example I think it's less readable! The
point I'm trying to make is that you _can_ perform this refactor, often with a
view to then supporting a collection of any number of elements.

If you really want to get nerdy about this, the reason that this works is that
`Nullable<T>` and `IEnumerable<T>` are both **functors**. But perhaps that's a
topic for another time ...
