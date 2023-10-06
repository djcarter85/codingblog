const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addCollection("posts", function (collection) {
    return collection.getFilteredByGlob("src/_posts/*.md");
  });
  eleventyConfig.addPlugin(syntaxHighlight);

  return {
    dir: {
      input: "./src",
      includes: "_includes",
      layouts: "_layouts"
    }
  }
};