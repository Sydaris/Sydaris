import { describe, expect, it } from "vitest";

import {
  buildViewCatalogContext,
  createViewCatalog,
} from "@/agent-runtime/view-catalog";
import { planningPlugin } from "@/test-fixtures/views";
import { ExtensionRegistry } from "@/runtime/extension-host/extension-registry";

describe("View Catalog", () => {
  it("publishes authoritative definitions without exposing Command contracts", () => {
    const registry = new ExtensionRegistry();
    registry.registerPlugin(planningPlugin);

    const catalog = createViewCatalog(registry);
    const context = buildViewCatalogContext(registry);

    expect(catalog).toEqual([
      expect.objectContaining({
        key: "test_planning",
        cardTypes: expect.arrayContaining([
          expect.objectContaining({ key: "WorkCard" }),
        ]),
      }),
    ]);
    expect(context).toContain("权威静态定义");
    expect(context).toContain("直接依据本 Catalog 回答");
    expect(context).toContain("不要调用业务状态读取工具");
    expect(context).toContain("WorkCard");
    expect(context).not.toContain("work.create");
  });
});
