---
title: ASP.NET Core JSON API Cheat Sheet
summary: Some lessons learned building a JSON API using ASP.NET Core.
---

Recently I've been working on a web API written using [ASP.NET
Core](https://docs.microsoft.com/en-us/aspnet/core/?view=aspnetcore-3.0), with
data transferred in [JSON](https://www.json.org/) format.

ASP.NET Core has built-in functionality for converting between JSON and .NET
objects, based on the popular [Json.NET
library](https://www.newtonsoft.com/json) (although in ASP.NET Core 3.0,
released a couple of weeks ago, this has moved to the newer [System.Text.Json
library](https://www.hanselman.com/blog/SystemTextJsonAndNewBuiltinJSONSupportInNETCore.aspx)).

While building this web API I have discovered a number of things concerning JSON
APIs and ASP.NET Core. This article is a mixed bag of tips and tricks which may
be useful for you (or for me in a few months' time).

## Parameter binding

An ASP.NET Core controller method might have a number of arguments. The values
of these arguments can be fetched from a number of places, and you can control
which using the following attributes:

- `[FromBody]`: the value will be fetched from the body of the HTTP request.
  Only one argument can have this attribute, as the entire body is deserialized.
- `[FromRoute]`: the value will be fetched from a route parameter. You can use
  the `Name` property of the attribute to specify the name of the route
  parameter to use; if you don't, it'll use the argument name. I'd view using
  the `Name` property as a best practice, as it allows you to name the C#
  argument something different to the route parameter (which can be useful if
  some parsing needs to be done to the value before it can be used).
- `[FromQuery]`: the value will be fetched from the query string. You can use
  the `Name` property in a similar way to above, and I'd recommend it.
- `[FromHeader]`: the value will be fetched from a HTTP header. The `Name`
  property here is particularly useful, as header names containing multiple
  words often contain a hyphen, unlike C# variable names.
- `[FromForm]`: the value will be fetched from posted form fields. Only included
  here for completeness, as this is most useful for a website rather than an
  API.

[The ASP.NET Core docs on
this](https://docs.microsoft.com/en-us/aspnet/core/mvc/models/model-binding?view=aspnetcore-3.0#sources)
are pretty comprehensive as to how this works.

You can omit these attributes and it will try to guess where the values can be
found, but I think it's better to be explicit.

## `[ApiController]`

My first attempt at using `[FromBody]` to deserialize JSON didn't go very well.
I found that if the request body didn't have the correct structure, or wasn't
even valid JSON, then the controller method argument was simply set to `null`.

This was a surprise to me! I was expecting either an unhandled exception
(resulting in a 500 Internal Server Error), or a 400 Bad Request containing
details of what was wrong.

I discovered what I was missing: `ApiControllerAttribute`.

If you decorate your controller with `[ApiController]`, then (among other
things) you get JSON validation up-front. That is, if the request body isn't
valid JSON, or cannot be deserialized into an object of the correct type, then
the server responds with a 400 Bad Request and the response body contains
details of the problem.

For more information about this attribute, [check out this article on
StrathWeb](https://www.strathweb.com/2018/02/exploring-the-apicontrollerattribute-and-its-features-for-asp-net-core-mvc-2-1/).

The basic Visual Studio template contains this, but it's easy to forget when
adding a new controller yourself.

## Custom error format

This is great, but the JSON response body isn't particularly friendly, and most
likely won't match the format your API uses for errors.

Fortunately you can customise this, and it's pretty easy to do. What you're
looking for is `ApiBehaviorOptions.InvalidModelStateResponseFactory`, which can
be set at application startup. Add the following to your `ConfigureServices`
method in the `Startup` class:

##### C#

```cs
services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = actionContext => 
    {
        var error = // TODO: create your error object here

        return new BadRequestObjectResult(error);
    }
});
```

## Required properties

In many cases, the JSON schema requires a certain property to be present. You
can alert the deserializer to this by using the `[JsonRequired]` attribute on
the property. If you do this and the incoming JSON does not contain the
property, the deserialization fails.

Another way of doing this is to use `[JsonProperty(Required =
Required.Always)]`. This allows you to specify one of four behaviours relating
to required properties ([see here for more
details](https://www.newtonsoft.com/json/help/html/T_Newtonsoft_Json_Required.htm))
which gives you even greater control over the deserialization. The
`[JsonProperty]` attribute allows you to customize loads of other behaviours
too; [check out the
docs](https://www.newtonsoft.com/json/help/html/T_Newtonsoft_Json_Serialization_JsonProperty.htm)
for more info.

The `Required` property also controls how `null` values are serialized. If you
want to set that globally, you can add the following in your `ConfigureServices`
method:

##### C#

```cs
services.AddMvc()
    .AddJsonOptions(o =>
    {
        o.SerializerSettings.NullValueHandling = // TODO: pick a value
    });
```

## Disallow integers for enumeration values

Often your JSON schema will contain **enumerations**: properties which have a
small collection of valid string values. These have a natural mapping to C#
`enum`s, and Json.NET handles that for you out of the box.

However, I found that if I passed in an integer to an enumeration property,
deserialization would succeed and the integer would be cast to the `enum` type.
This is generally not a good idea, because then an API consumer could pass in
any integer and you'd end up with an invalid value.

You can disable this behaviour during startup by adding the following to your
`ConfigureServices` method:

##### C#

```cs
services.AddMvc()
    .AddJsonOptions(o =>
    {
        o.SerializerSettings.Converters.Add(new StringEnumConverter { AllowIntegerValues = false });
    });
```

This will convert the JSON value to the appropriate `enum` value using a
case-insensitive comparison on the name of the enum values, but will reject any
integer value.

This is a global setting, but you can apply it to a single property using the
`[JsonProperty]` attribute (again, [see the docs for more
information](https://www.newtonsoft.com/json/help/html/T_Newtonsoft_Json_Serialization_JsonProperty.htm)).

## Custom converters

This leads us nicely into a discussion of converters. Out of the box, Json.NET
handles conversion between JSON and C# for many different data types, including
strings, numbers and booleans.

But what if you want to use an unsupported C# data type? A good example is
[NodaTime](https://nodatime.org/)'s `LocalDate`, which would be represented in
JSON in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format.

It's easy to create custom converters; [there's a good article in the Json.NET
docs which shows you
how](https://www.newtonsoft.com/json/help/html/CustomJsonConverter.htm). Then
you just need to register it at startup as follows:

##### C#

```cs
services.AddMvc()
    .AddJsonOptions(o =>
    {
        o.SerializerSettings.Converters.Add(new MyCustomConverter());
    });
```

## Swashbuckle

[Swashbuckle](https://github.com/domaindrivendev/Swashbuckle.AspNetCore) is a
tool which creates API documentation directly from your ASP.NET Core project. It
can generate [OpenAPI](https://swagger.io/docs/specification/about/)
documentation which you can release to the consumers of your API, which lets
them know exactly how to use the API. It also comes with a UI for the
documentation, giving even more ways for consumers to discover your API.

The [Getting
Started](https://github.com/domaindrivendev/Swashbuckle.AspNetCore#getting-started)
instructions are pretty good so I suggest you start there.

## NSwag

[NSwag](https://github.com/RicoSuter/NSwag) combines the features of Swashbuckle
with the ability to generate C# code for consuming an API. All you need is the
OpenAPI spec for the API you would like to consume, and you can easily generate
client code in a number of ways. I found the "connected service" approach to be
good; I'd recommend [How to generate C# or TypeScript client code for OpenAPI
(Swagger)
specification](https://medium.com/@unchase/how-to-generate-c-or-typescript-client-code-for-openapi-swagger-specification-d882d59e3b77)
if you'd like to try it. There are a number of other tutorials linked on [the
project's GitHub page](https://github.com/RicoSuter/NSwag).

This is not required if you're just exposing a JSON API, but if you're doing
that you may well be calling other APIs (for example, as part of a microservices
architecture), so I felt it was worth a mention. You could also use this to
generate a C# client library to release to the consumers of your API.

## Further reading

- [This
  article](https://andrewlock.net/model-binding-json-posts-in-asp-net-core/) by
  Andrew Lock explains more about model binding.
- [This
  article](https://www.dotnetcurry.com/aspnet/1390/aspnet-core-web-api-attributes)
  on DotNetCurry describes the use of different attributes on ASP.NET Core
  controllers and their arguments.
- For more general information about how Json.NET works, [check out the official
  docs](https://www.newtonsoft.com/json/help/html/Introduction.htm).