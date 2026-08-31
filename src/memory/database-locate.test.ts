import { describe, expect, it } from "vitest";

import { diceSimilarity, lexicalMatch } from "@/memory/database-locate";

describe("Locate lexical baseline", () => {
  it("preserves exact and alias object identification", () => {
    expect(lexicalMatch("星河计划", "星河计划")).toMatchObject({
      method: "exact",
      score: 1,
    });
    expect(lexicalMatch("星河计划杯", "星河计划", ["星河计划杯"])).toMatchObject({
      method: "alias",
    });
  });

  it("finds an object name embedded in a natural-language query", () => {
    const match = lexicalMatch(
      "星河计划如果改变赛制，有没有以前的经验？",
      "星河计划",
    );
    expect(match?.method).toBe("contains");
    expect(match?.score).toBeGreaterThan(0.9);
  });

  it("normalizes compatible Unicode forms and keeps fuzzy similarity explainable", () => {
    expect(lexicalMatch("ＡＢＣ", "ABC")?.method).toBe("normalized-exact");
    expect(diceSimilarity("新闻稿撰写规范", "新闻稿写作规范")).toBeGreaterThanOrEqual(0.5);
  });

  it("returns no lexical hit when strings share no useful character sequence", () => {
    expect(lexicalMatch("完全无关", "新闻稿")).toBeUndefined();
  });
});
