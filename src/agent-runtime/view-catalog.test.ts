import { describe, expect, it } from "vitest";

import {
  buildViewCatalogContext,
  createViewCatalog,
} from "@/agent-runtime/view-catalog";
import { planningPlugin } from "@/test-fixtures/views";
import { readOnlyPlugin } from "@/test-fixtures/views";
import { directoryPlugin } from "@/test-fixtures/views";
import { ExtensionRegistry } from "@/runtime/extension-host/extension-registry";

describe("View Catalog", () => {
  it("publishes authoritative definitions without exposing Command contracts", () => {
    const registry = new ExtensionRegistry();
    registry.registerPlugin(planningPlugin);
    registry.registerPlugin(directoryPlugin);
    registry.registerPlugin(readOnlyPlugin);

    const catalog = createViewCatalog(registry);
    const context = buildViewCatalogContext(registry);

    expect(catalog).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: "test_planning",
        cardTypes: expect.arrayContaining([
          expect.objectContaining({ key: "WorkCard" }),
        ]),
        aiWriteCapabilities: expect.arrayContaining([
          expect.stringContaining("具体工作"),
        ]),
      }),
    ]));
    expect(context).toContain("权威静态定义");
    expect(context).toContain("直接依据本 Catalog 回答");
    expect(context).toContain("不要调用业务状态读取工具");
    expect(context).toContain("适用任务");
    expect(context).toContain("准备推进一项测试工作");
    expect(context).toContain("AI 可提议");
    expect(context).toContain("AI 不能直接创建或修改外部记录");
    expect(context).toContain("WorkCard");
    expect(context).not.toContain("work.create");
  });
});
