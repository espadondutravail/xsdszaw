import { expect, test } from "@jest/globals";
import { truncateMetaText, truncateUrl } from "./search-preview";

test("Truncates description", () => {
  expect(
    truncateMetaText(
      "Accept everyone around you. Part of being a good person is not being judgmental. You accept everyone, no matter what race, age, sexual orientation, gender identity, or culture they are. Realize that everybody has feelings, every person is valid, and everyone should always be treated with respect.\n\nBe respectful of elderly people. "
    )
  ).toMatchInlineSnapshot(
    `"Accept everyone around you. Part of being a good person is not being judgmental. You accept everyone, no matter what race, age, sexual orientation, gender ..."`
  );
});

test("Truncates description", () => {
  expect(
    truncateMetaText(
      "The best way to determine the best balance for you is by learning to check in with your inner compass — and your results. With intentionality and a little creativity, you can recalibrate your expectations and reset your work-home balance.&nbsp"
    )
  ).toMatchInlineSnapshot(
    `"The best way to determine the best balance for you is by learning to check in with your inner compass — and your results. With intentionality and a little ..."`
  );
});

test("Truncates description", () => {
  expect(
    truncateMetaText(
      "The meta description summarizes a page&#8217;s content and presents that to users in the search results. It&#8217;s one of the first things people will likely see when searching for something, so optimizing it is crucial for SEO. It&#8217;s your chance to persuade users to click on "
    )
  ).toMatchInlineSnapshot(
    `"The meta description summarizes a page&#8217;s content and presents that to users in the search results. It&#8217;s one of the first things people will ..."`
  );
});

test("Truncates description", () => {
  expect(
    truncateMetaText(
      "A meta description (also known as a “description tag”) is an HTML attribute designed to describe the content of a webpage. Here’s what a meta description looks like in HTML form:"
    )
  ).toMatchInlineSnapshot(
    `"A meta description (also known as a “description tag”) is an HTML attribute designed to describe the content of a webpage. Here’s what a meta description ..."`
  );
});

test("Truncates url", () => {
  expect(
    truncateUrl("https://ahrefs.com/writing-tools/meta-description-generator")
  ).toMatchInlineSnapshot(
    `"https://ahrefs.com/writing-tools/meta-description-gen..."`
  );
});

test("Truncates url", () => {
  expect(
    truncateUrl(
      "https://university.webflow.com›lesson›seo-title-meta-description"
    )
  ).toMatchInlineSnapshot(
    `"https://university.webflow.com›lesson›seo-title-meta-..."`
  );
});
