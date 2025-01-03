---
title: "Blazor, Tailwind and GitHub Pages"
summary: 
---

As a brief interlude to my ProcGen Fun series, I'd like to 

intro - what I want to do and why

intro to blazor

- hosting models
- what is WASM

What follows is a list of steps that I followed. If you ever want to achieve the
same goal then I hope that this will help!

## 1. add a blank blazor project

## 2. upgrade to .NET 8

For some reason, step 1 generated a Blazor project targetting .NET 7.0, which is
out of support. So I upgraded to .NET 8.0 (the latest LTS version of .NET at the
time of writing).

This involved changing the `TargetFramework` property in the project file to
`net8.0`. I also upgraded the two Blazor NuGet packages to the latest v8
release.

## 3. add tailwind

`npm i tailwindcss`

`npx tailwindcss init`

then add theme

## 4. add deployment to GitHub Pages

add nuget package

add gh actions script

set source in repo settings

## 5. add custom domain

add cname to wwwroot (so it gets published)

set the base

configure your DNS

## appendix: development

easier in VS code with hot reload