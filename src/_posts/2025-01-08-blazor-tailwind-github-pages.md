---
title: "Deploying a Blazor site to GitHub Pages"
summary: How to create a Blazor WebAssembly website using Tailwind CSS and deploy it to GitHub Pages.
---

As a brief interlude to my [ProcGen Fun](/2024/12/18/PGF-00/) series, I'd like
to write up how I created a [playground
website](https://procgenfun.carterdan.net/) which allows you to run the code
I've been writing in that series.

The procedural generation is all being written in C#, so we need a website which
can run .NET code (directly or indirectly). For many years the way to do this
would be to build a static website (using HTML, CSS and JavaScript) which called
a web API implemented in .NET. However, with the recent advent of [WebAssembly
(WASM)](https://webassembly.org/) we can now run binary code client-side.
[Blazor](https://blazor.net) is the .NET technology which uses WASM to run .NET
code in the browser, using a templating syntax called Razor.

In my case, I've built a static website using Blazor, using [Tailwind
CSS](https://tailwindcss.com/) for styling, and deployed it to [GitHub
Pages](https://pages.github.com/). What follows is a list of steps that you can
follow, based on what I did. I hope some or all of it is helpful!

## 1. Add a blank Blazor project

In Visual Studio, create a new blank Blazor project. You can do this using "Add
New Project" and selecting the "Blazor WebAssembly App Empty" template. You can
also do this via the command line, using the following command.

```cmd
dotnet new blazorwasm-empty -o YourProjectName
```

The reason I suggest using the "empty" template is that the standard template
comes with Bootstrap CSS pre-installed, and we want to use Tailwind CSS.

## 2. Upgrade to the latest .NET

For some reason, on my machine step 1 generated a Blazor project targetting .NET
7, which is out of support. If this happens to you, I suggest upgrading to .NET
8 (the latest LTS version of .NET at the time of writing).

To do this, change the `TargetFramework` property in the project file to
`net8.0`, and upgrade the two Blazor NuGet packages to the latest v8 release.

## 3. Add Tailwind

The easiest way to add Tailwind CSS to a project is to install it using `npm`,
and then use the `init` command to create a blank config file.

```cmd
npm install -D tailwindcss
npx tailwindcss init
```

In your newly-created config file, set the template paths (the `content`
setting) as follows. This tells Tailwind where to look for class names when
compiling the CSS.

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{razor,html}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Then create your main CSS file. I called mine `tailwind.css` and put it in the
`Styles` directory.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

The build script we're going to use (see below) will compile this file and
output the result to `css/tailwind.css`. So in your `index.html` file, add a
reference to this path in the head:

```html
<!DOCTYPE html>
<html lang="en">

<head>
  ...
  <link href="css/tailwind.css" rel="stylesheet" />
  ...
</head>

<body>
  ...
</body>
</html>
```

Now we can use Tailwind classes in our HTML files and Razor components.

For more information on how to configure Tailwind, see [the official
docs](https://tailwindcss.com/docs/installation).

## 4. Add deployment to GitHub Pages

There are a few things which need to be done before you can publish your site to
GitHub Pages. Fortunately there is a NuGet package called
[PublishSPAforGitHubPages.Build](https://github.com/jsakamoto/PublishSPAforGitHubPages.Build)
which does lots of the work for you! I suggest having a read of the
documentation to understand what it does.

You can install it using this command.

```cmd
dotnet add package PublishSPAforGitHubPages.Build
```

Then you need a GitHub Actions script, to be run on every push to your main
branch. This should be placed in a YAML file (I called mine `gh-pages.yml`) in
the `.github/workflows` folder of your repository.

Here's the script I used. If you use this script then you might need to change
various branch names and paths to match your setup.

```yaml
name: GitHub Pages Deployment

on:
  push:
    branches:
      - main

jobs:
  deploy:
    permissions:
      contents: write
    runs-on: ubuntu-latest
    steps:
      # Checkout the code
      - uses: actions/checkout@v4

      # Install .NET SDK
      - name: Setup .NET SDK
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 8.0.x

      # Install NPM dependencies
      - name: Install NPM dependencies
        working-directory: ./ProcGenFun.Blazor
        run: npm i

      # Compile Tailwind CSS
      - name: Compile Tailwind CSS
        working-directory: ./ProcGenFun.Blazor
        run: npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/css/tailwind.css

      # Publish the site
      - name: Publish
        run: dotnet publish ./ProcGenFun.Blazor/ProcGenFun.Blazor.csproj -c:Release -o:publish -p:GHPages=true

      # Deploy the site
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${% raw %}{{ secrets.GITHUB_TOKEN }}{% endraw %}
          publish_dir: publish/wwwroot
          force_orphan: true
          publish_branch: gh-pages
```

The key thing here is that we compile the Tailwind CSS before compiling the
Blazor project, so that the CSS output is included in the compiled bundle. We
then push this bundle in a single orphaned commit to the `gh-pages` branch.

The final step is to set up GitHub Pages to deploy from the `gh-pages` branch.
This means that every time the `gh-pages` branch changes (i.e. when our script
is run), GitHub Pages will update our public website to match the contents of
the repository on that branch. In the GitHub web UI, go to Settings (for the
repository), click on Pages, and then under "branch" select `gh-pages`.

## 5. Add custom domain

Your site will now be deployed at `{username}.github.io/{repository}` (e.g. mine
was available at `djcarter85.github.io/ProcGenFun`). Often you'll want to use a
custom domain instead; for example, I have published mine at
[procgenfun.carterdan.net](https://procgenfun.carterdan.net).

The [GitHub
docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
for this are reasonably clear (including how to configure the settings with your
DNS provider), but it's worth noting that if you use the GitHub web UI to
configure the custom domain, it'll make a change on your `gh-pages` branch which
will be overwritten the next time the GitHub Actions script is run. Instead, add
the `CNAME` file yourself in the `wwwroot` directory of your Blazor project,
specifying your desired custom domain name on a single line. This will then be
placed in the right location within your published bundle.

As a final step, you'll need to set the site's base path in your build script.
The NuGet package referenced above assumes you're not using a custom domain
name, and sets the base path to `/{repository}`. You can set the base path back
to `/` by adding the `GHPagesBase` parameter when publishing the site in your
GitHub Actions script:

```yaml
...
      # Publish the site
      - name: Publish
        run: dotnet publish ./ProcGenFun.Blazor/ProcGenFun.Blazor.csproj -c:Release -o:publish -p:GHPages=true -p:GHPagesBase=/
...
```

## Appendix: development

The easiest way I found to develop using this setup is to use VSCode. In one
terminal I set up Tailwind to automatically recompile the CSS when anything
changes.

```cmd
cd ProcGenFun.Blazor
npx tailwindcss -i .\Styles\tailwind.css -o .\wwwroot\css\tailwind.css --watch
```

And then in another terminal I started the Blazor project, using the `watch`
command to reload the site when anything changes.

```cmd
cd ProcGenFun.Blazor
dotnet watch
```

This gives you fast feedback on the changes you make as you're developing your
site.

## Further reading

Here's a couple of related blog posts which I found helpful.

- [Deploying an ASP.NET Blazor WebAssembly App to GitHub
Pages](https://positiwise.medium.com/deploying-an-asp-net-blazor-webassembly-app-to-github-pages-9f7bc476938a)
- [Integrating Tailwind CSS in
  Blazor](https://timdeschryver.dev/blog/integrating-tailwind-css-in-blazor)
