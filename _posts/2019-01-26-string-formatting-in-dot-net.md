---
title: String formatting in .NET
summary: In any programming language, it is very common to want to take something that is not a string (say a number) and turn it into a string. Let's have a look at the many ways you can do this in .NET.
---

In any programming language, it is very common to want to take something that is
not a string (say a number) and turn it into a string. Perhaps you need to
display it on the command-line, or in some sort of GUI, or when writing to a
file (etc ...).

There are lots of different ways of turning .NET objects into a string, each
with their own uses. I will try to show you as many as possible in this article.

All the examples will be in C#, because this is my blog and I can do what I
like!

## The `ToString` method

Every object in .NET has a parameterless `ToString` method (it is one of the few
methods on the `System.Object` base class). By default it returns the fully
qualified name of the type
([source](https://docs.microsoft.com/en-us/dotnet/api/system.object.tostring)).

This is usually not very useful, so the `ToString` method is virtual to allow
you to override it. When you implement any class in .NET, you can override
`ToString` to do whatever you want.

Many of the built-in .NET types override this method to do something useful. For
example, all of the number types override `ToString` to return a basically
formatted number. Here are a couple of examples:

|Type|Example|Output|
|---|---|---|
|`System.Int32`|`-123456`|-123456|
|`System.Decimal`|`-1.23m`|-1.23|

### Standard format strings

Many types in .NET have another overload of the `ToString` method, which allows
you to pass in what is known as a "format string". This format string specifies
how the object is to be formatted.

For example, if you call `ToString` on a `System.Decimal` with the format string
`"e"`, it will format it using exponential notation (e.g. `0.000123m` would be
formatted as `"1.23E-004"`).

The .NET documentation is pretty comprehensive when it comes to the standard
format strings for [numeric
types](https://docs.microsoft.com/en-us/dotnet/standard/base-types/standard-numeric-format-strings)
and [dates and
times](https://docs.microsoft.com/en-us/dotnet/standard/base-types/standard-date-and-time-format-strings).

### Custom format strings

The examples above are known as "standard" format strings, because they are
pre-defined to control the behaviour of the `ToString` method. However,
sometimes it is useful to build up your own format strings from some pre-defined
building blocks. These are known as "custom" format strings.

A good example of this is the `System.DateTime` struct, where there are many
building blocks, such as `"d"` for the day of the month, `"MMMM"` for the full
name of the month and `"yyyy"` for the full year.

Taking `var date = new System.DateTime(2019, 1, 2)` as an example, here are some
of the things you can do:

|C# code|Output|
|---|---|
|`date.ToString("dd MMM yyyy")`|02 Jan 2019|
|`date.ToString("ddd d MMMM yyyy")`|Wed 2 January 2019|
|`date.ToString("yyyy-MM-dd")`|2019-01-02|

You'll notice that anything that is not recognised as a building block (such as
a space or hyphen) is simply output verbatim.

### Cultures and `IFormatProvider`

All of the examples that we've seen so far have used English for any words (e.g.
day and month names). This is because my computer is set up to work with British
English, and .NET respects that by default. There are other formatting options
that are particular to different cultures around the world; for example, in
Europe it is customary to use a comma as a decimal separator rather than a full
stop.

Many .NET types allow you to pass an instance of `IFormatProvider` to the
`ToString` method which specifies how to deal with culture-specific formatting
requirements. The `CultureInfo` class implements this interface, and uses the
[standard .NET culture
specifiers](https://azuliadesigns.com/list-net-culture-country-codes/).

Here are some `DateTime` examples, using the same example of `var date = new
System.DateTime(2019, 1, 2)`:

|C# code|Output|
|---|---|
|`date.ToString("d", new CultureInfo("en-GB"))`|Wednesday, 2 January 2019|
|`date.ToString("d", new CultureInfo("en-US"))`|Wednesday, January 2, 2019|
|`date.ToString("d", new CultureInfo("fr-FR"))`|mercredi 2 janvier 2019|
|`date.ToString("d", new CultureInfo("de-DE"))`|Mittwoch, 2. Januar 2019|

You can use `CultureInfo.CurrentCulture` to access the [machine's
culture](https://docs.microsoft.com/en-us/dotnet/api/system.globalization.cultureinfo.currentculture),
and `Culture.InvariantCulture` to use a [non-specific
culture](https://docs.microsoft.com/en-us/dotnet/api/system.globalization.cultureinfo.invariantculture).

It is usually best to specify the culture, especially if you are interacting
with another system that expects a value in a particular format.

## Composing strings

Suppose you want to compose a string from many different building blocks. There
are a number of different ways of doing this, so let's take a look at these in
turn.

For the following examples, let's take the following values:

```c#
var amount = 5;
var price = 1.2m;
var date = new System.DateTime(2019, 1, 2);
```

### String concatenation

The simplest way to compose strings is by using the `+` operator:

```c#
var output = "We sold " + amount.ToString() + " mars bars on " + date.ToString("D", new CultureInfo("en-US")) + ", each costing £" + price.ToString("N2") + ".";
```

This gives `"We sold 5 mars bars on Wednesday, January 2, 2019, each costing
£1.20."`.

You can omit the `ToString` call if you like, and .NET will do an implicit cast
to `string`, which is equivalent to calling `ToString` with no arguments:

```c#
var output = "We sold " + amount + " mars bars on " + date + ", each costing £" + price + ".";
```

This gives `"We sold 5 mars bars on 1/2/19 12:00:00 AM, each costing £1.2."`. As
you can see, this is not always desirable as you have no control over how the
strings are formatted.

### The `string.Format` method

The static method `Format` on the `System.String` class can be used to simplify
this. You give it a string containing placeholders and some objects, and the
method will format them and insert them into the placeholders.

It's best explained with an example:

```c#
var output = string.Format("We sold {0} mars bars on {1}, each costing £{2}.", amount, date, price);
```

This gives `"We sold 5 mars bars on 1/2/19 12:00:00 AM, each costing £1.2."`, as
before. It has formatted the three objects by calling `ToString` on them, and
inserted them into the placeholders using zero-based indexing.

You can also specify format strings, like so:

```c#
var output = string.Format("We sold {0} mars bars on {1:D}, each costing £{2:N2}.", amount, date, price);
```

This gives `"We sold 5 mars bars on Wednesday, January 2, 2019, each costing
£1.20."`.

If you want to specify the culture, you can do so by passing it as the first
parameter. This will use the specified culture for every conversion in the
string. See
[here](https://docs.microsoft.com/en-us/dotnet/api/system.string.format) for
more info.

### Methods using `string.Format` implicitly

One of the overloads to `Console.WriteLine` has the following definition:
`public static void WriteLine(string format, params object[] arg)`. This works
the same way as the `string.Format` method: you give it a format string
containing placeholders and some objects to be formatted and inserted.

There are a number of methods in the .NET framework and in third-party libraries
that work this way, so watch out for them!

### String interpolation

**String interpolation** is a feature that was introduced in C# 6, and it takes
the `string.Format` method one step further. If you prepend a string with `$`,
then anything inside curly braces gets formatted just like `string.Format`. The
following gives identical output to the previous example.

```c#
var output = $"We sold {amount} mars bars on {date:D}, each costing £{price:N2}.";
```

This can make your code much more readable, so I'd advise using it where you
need to compose strings!

See
[here](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/tokens/interpolated)
for more information, including how to specify the culture.

## Debugging

When debugging, you often want to see the property values of a particular
object. By default, the Visual Studio debug window will use the `ToString`
method to format the object so you can see its value.

You may be tempted to override `ToString` to make debugging easier (remember,
the default implementation of `ToString` simply returns the type name). Don't do
this! If you do, it is very easy for these string representations to find their
way into your production code. Instead, read [this
article](https://docs.microsoft.com/en-us/visualstudio/debugger/using-the-debuggerdisplay-attribute)
to find out a better way of doing it using
`System.Diagnostics.DebuggerDisplayAttribute`.

## Summary

In this article we saw a number of ways of formatting strings in .NET:

- The `ToString` method (with or without format strings and culture specifiers)
- The `string.Format` method
- String interpolation

Let me know if you can think of any other ways of doing this!
