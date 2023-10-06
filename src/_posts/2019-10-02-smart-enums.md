---
title: Smart Enums In C#
summary: A C# design pattern I'm quite fond of.
---

A quick post about a design pattern that I quite like.

Context: we're dealing with distances in some way. Let's write some classes to
express this.

##### C#

```cs
class Distance
{
    public Distance(double value, DistanceUnit unit)
    {
        this.Value = value;
        this.Unit = unit;
    }

    public double Value { get; }
    public DistanceUnit Unit { get; }
}

enum DistanceUnit
{
    Miles,
    Kilometres,
}
```

We need to be able to convert between distances measured in different units.
Let's add a method to the `Distance` class.

##### C#

```cs
class Distance
{
    // ...

    public Distance Convert(DistanceUnit targetUnit)
    {
        return new Distance(
            this.Value * ConversionFactorToKilometres(this.Unit) / ConversionFactorToKilometres(targetUnit),
            targetUnit);
    }

    private double ConversionFactorToKilometres(DistanceUnit unit)
    {
        switch (unit)
        {
            case DistanceUnit.Miles:
                return 1.60934;
            case DistanceUnit.Kilometres:
                return 1;
            default:
                throw new System.ArgumentException();
        }
    }
}
```

This works, but it's a little clunky. Two things I don't like:

1. The conversion factor is a property of the unit itself, so it doesn't seem
   right that it's defined in the `Distance` class.
2. We have to deal with the fact that enums aren't quite type-safe; it's
   perfectly possible for someone to pass in `(DistanceUnit)100`, and so we need
   the exception.

Let's fix (1) by adding attributes to the enum:

##### C#

```cs
class ConversionFactorToKilometresAttribute : Attribute
{
    public ConversionFactorToKilometresAttribute(double factor)
    {
        this.Factor = factor;
    }

    public double Factor { get; }
}

enum DistanceUnit
{
    [ConversionFactorToKilometres(1.60934)]
    Miles,
    [ConversionFactorToKilometres(1)]
    Kilometres,
}

class Distance
{
    // ...

    private double ConversionFactorToKilometres(DistanceUnit unit)
    {
        var attribute = (ConversionFactorToKilometresAttribute)typeof(DistanceUnit)
            .GetMember(unit.ToString())[0]
            .GetCustomAttributes(typeof(ConversionFactorToKilometresAttribute), false)
            .Single();
        return attribute.Factor;
    }
}
```

Great! The conversion factor is now defined in the `DistanceUnit` enum, which
makes much more sense. Unfortunately we have added some reflection, which always
gives me the heebie-jeebies, and we still don't cope with the possibility that
the enum value isn't defined.

This is where the smart enum pattern comes in.

Let's replace the `enum` with a `class` with a small set of possible instances:

##### C#

```cs
class DistanceUnit
{
    private DistanceUnit(double conversionFactorToKilometres)
    {
        this.ConversionFactorToKilometres = conversionFactorToKilometres;
    }

    public static DistanceUnit Miles { get; } = new DistanceUnit(1.60934);
    public static DistanceUnit Kilometres { get; } = new DistanceUnit(1);

    public double ConversionFactorToKilometres { get; }
}

class Distance
{
    // ...

    // TODO: inline this method
    private double ConversionFactorToKilometres(DistanceUnit unit)
    {
        return unit.ConversionFactorToKilometres;
    }
}
```

The private constructor ensures that instances of `DistanceUnit` can only be
created from inside this class, and this only happens twice. In this way, it's
very similar to an enum in that there's only a small set of options for the
value.

In fact, calling it is *very* like an enum:

##### C#

```cs
var distance = new Distance(100, DistanceUnit.Miles);
```

The one downside to this is that a variable of type DistanceUnit could be
`null`, because it's a reference type. Ultimately this is a problem of C# rather
than this pattern, and it's partially fixed by the nullable reference types
feature of C# 8, released last week (note to self: start using C# 8).

## Another example

(Disclaimer: this example is entirely lifted from [a blog post by Jon
Skeet](https://codeblog.jonskeet.uk/2014/10/23/violating-the-smart-enum-pattern-in-c/).)

In our distance example, the "enum" values had properties but no behaviour. A
slight variant is to have an abstract class, with nested derived classes
defining the behaviour.

Here's an example.

```cs
public abstract class Operation
{
    private Operation()
    {
    }
 
    public static Operation Add { get; } = new AddOperation();
    public static Operation Subtract { get; } = new SubtractOperation();
 
    public abstract int Apply(int lhs, int rhs);
 
    private class AddOperation : Operation
    {
        public override int Apply(int lhs, int rhs)
        {
            return lhs + rhs;
        }
    }
 
    private class SubtractOperation : Operation
    {
        public override int Apply(int lhs, int rhs)
        {
            return lhs - rhs;
        }
    }
}
```

Note how the private constructor ensures no-one from outside the class can
create an instance, in the same way as before.

This is the best way to use this pattern if your "enum" values need behaviour.
It's up to you which fits your use case best.

## Summary

Smart enums are a great way of adding state or behaviour to enums in C#. I
wouldn't advocate using them for everything, but as soon as you add a `switch`
statement on the value of an enum, you should consider whether defining that
behaviour inside the type using this pattern would be better.

## Further reading

- [SmartEnum](https://github.com/ardalis/SmartEnum), a base class for this
  pattern. Personally I wouldn't bother with this, because the base class adds
  lots of generic code which you wouldn't normally need, but it's a useful
  reference to see other examples of the pattern.
- [Violating the smart enum
  pattern](https://codeblog.jonskeet.uk/2014/10/23/violating-the-smart-enum-pattern-in-c/)
  by Jon Skeet: how this pattern isn't as type-safe as you think (but you have
  to really *want* to break it).
