---
title: "Alphabetic World Cup"
summary: What if the World Cup could only contain one team for each letter of the alphabet?
---

Like many others at the moment, I've got World Cup fever and have really enjoyed
watching as many matches as possible on TV.

While I was watching Argentina vs Algeria the other day, I was thinking about
how some letters of the alphabet are well-represented by countries of the world
(such as `A`), while others are less common. I then got to thinking: if you were
to restrict the World Cup to only one representative for each letter of the
alphabet, which teams would you pick? Thus began a rabbit hole which my wife has
described as "delightfully nerdy".

This blog post isn't really about programming, but it's got an "optimisation"
element to it, so I hope regular readers will indulge me!

## Rules

Before we get started picking teams, lets draw up some rules.

Because we're only allowed to have one country per letter of the alphabet, we
can have a maximum of 26 countries. 24 is a more normal number for a tournament
like this (e.g. Euro 2024) so we'll go with that.

I've also decided to restrict the number of countries allowed from each
continent, to make it more realistic. Here's the allocation I've gone with; it's
proportionally based on the allocation for World Cup 2026.

Confederation | Continent | Places
--- | --- | ---
AFC | Asia | 4 or 5
CAF | Africa | 4 or 5
CONCACAF | North and Central America | 3 or 4
CONMEBOL | South America | 3 or 4
OFC | Oceania | 0 or 1
UEFA | Europe | 8

For the avoidance of doubt, I've gone with the official names of FIFA members [as
listed on the FIFA website](https://inside.fifa.com/associations). This doesn't
completely match how we might commonly refer to countries; for example, South
Korea is listed as Korea Republic.

## Process

OK, let's fill out the list of teams!

<div class="grid-cols-[auto_1fr]">
  <div>A</div>
  <div>Argentina</div>
  <div>
<svg class="w-4 h-4" id="Layer_1" enable-background="new 0 0 512 512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m512 256c0-31.314-5.633-61.311-15.923-89.043l-240.077-11.131-240.077 11.13c-10.29 27.733-15.923 57.73-15.923 89.044s5.633 61.311 15.923 89.043l240.077 11.131 240.077-11.13c10.29-27.733 15.923-57.73 15.923-89.044z" fill="#f0f0f0"/><path d="m256 512c110.071 0 203.906-69.472 240.077-166.957h-480.154c36.171 97.485 130.006 166.957 240.077 166.957z" fill="#0052b4"/><path d="m15.923 166.957h480.155c-36.172-97.485-130.007-166.957-240.078-166.957s-203.906 69.472-240.077 166.957z" fill="#d80027"/><g fill="#338af3"><path d="m322.783 178.088h-44.522l7.421-55.653 29.68-22.261 29.681 22.261v44.522z"/><path d="m189.217 178.088h44.522l-7.421-55.653-29.681-22.261-29.68 22.261v44.522z"/></g><path d="m285.682 178.088h-59.364v-55.653l29.682-22.261 29.682 22.261z" fill="#0052b4"/><path d="m166.957 166.958v122.434c0 29.153 14.082 55.079 35.802 71.332l15.583-3.899 19.664 19.782c5.815 1.198 11.832 1.829 17.995 1.829 6.13 0 12.117-.623 17.901-1.809l22.447-18.69 12.892 2.751c21.711-16.252 35.803-42.151 35.803-71.296v-122.434z" fill="#f0f0f0"/><g fill="#d80027"><path d="m166.957 166.957h35.617v35.617h-35.617z"/><path d="m238.191 166.957h35.617v35.617h-35.617z"/><path d="m309.426 166.957h35.617v35.617h-35.617z"/><path d="m202.574 202.574h35.617v35.617h-35.617z"/><path d="m273.809 202.574h35.617v35.617h-35.617z"/><path d="m166.957 238.18h35.617v35.617h-35.617z"/><path d="m202.574 273.798h35.617v35.617h-35.617z"/><path d="m238.191 238.18h35.617v35.617h-35.617z"/><path d="m309.426 238.18h35.617v35.617h-35.617z"/><path d="m273.809 273.798h35.617v35.617h-35.617z"/><path d="m238.191 309.415h35.617v35.617h-35.617z"/><path d="m202.574 309.418h-33.319c3.056 13.24 9.064 25.355 17.302 35.617h16.017z"/><path d="m309.426 345.036h16.016c8.24-10.262 14.246-22.378 17.302-35.617h-33.318z"/><path d="m202.574 345.036v15.541c10.359 7.795 22.465 13.384 35.617 16.066v-31.607z"/><path d="m273.809 345.036v31.607c13.153-2.68 25.258-8.271 35.617-16.066v-15.541z"/></g><g/><g/><g/><g/><g/><g/><g/><g/><g/><g/><g/><g/><g/><g/><g/></svg>
  
  B</div>
  <div>Brazil</div>
</div>

## draw
