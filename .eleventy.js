const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addCollection("posts", function (collection) {
    return collection.getFilteredByGlob("_posts/*.md");
  });
  eleventyConfig.addPlugin(syntaxHighlight);

  return {
    dir: {
      input: "./",
      includes: "_includes",
      layouts: "_layouts"
    }
  }
};