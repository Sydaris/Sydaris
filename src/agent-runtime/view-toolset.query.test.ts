import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { AgentSkillSession } from "@/agent-runtime/skill-runtime";
import { createAgentViewToolset } from "@/agent-runtime/view-toolset";
import { zodContractSchema, type PluginManifest } from "@/contracts";
import { ExtensionRegistry } from "@/runtime/extension-host/extension-registry";
import { directoryPlugin, testView } from "@/test-fixtures/views";

const cardId = "00000000-0000-4000-8000-000000000101";
const toolName = "query_test_records_count";

function fixture(skillSession?: AgentSkillSession) {
  const executeQuery = vi.fn((snapshot: { cards: readonly { id: string }[] }) => ({
    data: { count: snapshot.cards.length },
    sourceCardIds: snapshot.cards.map((card) => card.id),
    coverage: { level: "complete" as const },
  }));
  const plugin: PluginManifest = {
    id: "test.records", version: "1.0.0",
    contributes: { views: [{
      ...testView("test_records", "测试记录"),
      queries: [{
        key: "count", version: "1.0.0", label: "Count", description: "Count visible records",
        inputSchema: zodContractSchema(z.object({ name: z.string().optional() }).strict()),
        outputSchema: zodContractSchema(z.object({ count: z.number().int() })),
        execute: executeQuery,
      }],
    }] },
  };
  const registry = new ExtensionRegistry();
  registry.registerPlugin(directoryPlugin);
  registry.registerPlugin(plugin);
  const onQueryResult = vi.fn();
  const toolset = createAgentViewToolset({
    actor: { permissions: ["view.read", "view.write"] }, registry, skillSession, onQueryResult,
    readPort: {
      query: vi.fn().mockResolvedValue({
        viewKey: "test_records", pluginVersion: "1.0.0", schemaVersion: "1",
        stateVersion: "9", observedAt: "2026-08-31T00:00:00.000Z",
        cards: [{ id: cardId, viewKey: "test_records", cardTypeKey: "WorkCard",
          dimensions: { name: "Record" }, slots: {}, relatedObjectIds: [] }],
      }),
      locateObject: vi.fn(),
    } as never,
    commandBus: { dispatch: vi.fn() } as never,
  });
  const execute = toolset.tools[toolName].execute as unknown as (input: unknown) => Promise<unknown>;
  return { onQueryResult, executeQuery, toolset, execute };
}

describe("Agent View Query Toolset", () => {
  it("exposes only the selected View's Query catalog", () => {
    const { toolset } = fixture();
    expect(toolset.describeQueries("test_records")).toEqual([
      expect.objectContaining({ queryKey: "count", toolName }),
    ]);
    expect(toolset.describeQueries("test_directory")).toEqual([]);
  });

  it("requires a View observation before executing its Query", async () => {
    const { execute, executeQuery } = fixture();
    await expect(execute({})).rejects.toThrow("必须先用 readViewState 读取该 View 的具体业务目标");
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it("keeps state and evidence semantics server-side while returning typed results", async () => {
    const { onQueryResult, toolset, execute } = fixture();
    await toolset.readSnapshot("test_records");
    const output = await execute({});
    expect(output).toMatchObject({
      ok: true,
      view: { ref: "V1", key: "test_records", label: "测试记录", observedAt: "2026-08-31T00:00:00.000Z" },
      query: { key: "count" }, result: { count: 1 },
      references: { viewRef: "V1", sourceCardRefs: ["V2"], sourceRefsTruncated: false },
    });
    expect(output).not.toHaveProperty("coverage");
    expect(output).not.toHaveProperty("semantics");
    expect(output).not.toHaveProperty("input");
    expect(JSON.stringify(output)).not.toContain(cardId);
    expect(onQueryResult).toHaveBeenCalledExactlyOnceWith({
      viewKey: "test_records", queryKey: "count", complete: true, sourceCardCount: 1,
      semantics: expect.objectContaining({ observations: [expect.objectContaining({
        scope: "view:test_records:query:count", predicate: "query_returned_result",
      })] }),
    });
  });

  it("allows one correction, then disables a repeatedly invalid Query", async () => {
    const { toolset, execute, executeQuery } = fixture();
    await toolset.readSnapshot("test_records");
    await expect(execute({ limit: 50 })).resolves.toMatchObject({
      ok: false, error: {
        code: "INVALID_VIEW_QUERY_INPUT", viewKey: "test_records", queryKey: "count",
        issues: [{ path: "$", code: "unrecognized_keys", message: "未声明字段：limit" }],
        allowedFields: ["name"], retryable: true, correctionAttemptsRemaining: 1,
      },
    });
    expect(toolset.queryToolNames(["test_records"])).toContain(toolName);
    await expect(execute({ limit: 50 })).resolves.toMatchObject({
      ok: false, error: { retryable: false, correctionAttemptsRemaining: 0 },
    });
    expect(toolset.queryToolNames(["test_records"])).not.toContain(toolName);
    expect(executeQuery).not.toHaveBeenCalled();
  });

  it("accepts a valid correction after a rejected input", async () => {
    const { toolset, execute, onQueryResult } = fixture();
    await toolset.readSnapshot("test_records");
    await execute({ limit: 50 });
    await expect(execute({ name: "Record" })).resolves.toMatchObject({ ok: true, result: { count: 1 } });
    expect(onQueryResult).toHaveBeenCalledTimes(1);
  });

  it("hides Query tools outside the active Skill's View access", () => {
    const { toolset } = fixture({ canReadView: (key: string) => key === "test_directory" } as unknown as AgentSkillSession);
    expect(toolset.queryToolNames(["test_records"])).toEqual([]);
  });
});
