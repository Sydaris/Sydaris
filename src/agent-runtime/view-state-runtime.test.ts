import { describe, expect, it, vi } from "vitest";

const databaseState = vi.hoisted(() => ({
  findObjects: vi.fn().mockResolvedValue([]),
  findViewMemory: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/db", () => ({
  getDatabase: () => ({
    memoryGlobalObject: { findMany: databaseState.findObjects },
    viewHigherMemory: { findUnique: databaseState.findViewMemory },
  }),
}));

import { createViewStateRuntime } from "@/agent-runtime/view-state-runtime";
import { MemoryEvidenceAccumulator } from "@/memory/evidence-accumulator";
import { planningPlugin } from "@/test-fixtures/views";
import { ExtensionRegistry } from "@/runtime/extension-host/extension-registry";

describe("View State Runtime model result", () => {
  it("keeps evidence protocol server-side", async () => {
    const registry = new ExtensionRegistry();
    registry.registerPlugin(planningPlugin);
    const onObserved = vi.fn();
    const runtime = createViewStateRuntime({
      registry,
      evidence: new MemoryEvidenceAccumulator({
        query: "",
        mode: "object-assertion",
        seedMap: { facets: [], objects: [], assertions: [], connections: [] },
      }),
      userQuery: "请读取周常训练",
      resolveCardReference: vi.fn(),
      readSnapshot: vi.fn().mockResolvedValue({
        viewKey: "test_planning",
        pluginVersion: "1.3.1",
        schemaVersion: "3",
        stateVersion: "0",
        observedAt: "2026-09-01T00:00:00.000Z",
        cards: [],
        references: [{
          ref: "V1",
          label: "测试计划",
          target: { kind: "view", viewKey: "test_planning" },
        }],
      }),
      presentCards: vi.fn().mockReturnValue([]),
      onObserved,
      onListObserved: vi.fn(),
    });

    const { output } = await runtime.read({
      viewKey: "test_planning",
      question: "周常训练当前是什么状态",
      targets: [{ kind: "name", value: "周常训练" }],
    });

    expect(output).toEqual({
      view: {
        ref: "V1",
        key: "test_planning",
        label: "测试计划",
        observedAt: "2026-09-01T00:00:00.000Z",
        cardCount: 0,
      },
      targets: ["周常训练"],
      matchingCards: [],
    });
    expect(output).not.toHaveProperty("coverage");
    expect(output).not.toHaveProperty("semantics");
    expect(output).not.toHaveProperty("next");
    expect(output.view).not.toHaveProperty("stateVersion");
    expect(onObserved).toHaveBeenCalledWith(expect.objectContaining({
      coverage: expect.objectContaining({ contentPresence: "absent" }),
      semantics: expect.objectContaining({
        observations: [expect.objectContaining({
          scope: "view:test_planning:target:周常训练",
        })],
      }),
    }));
  });

  it("lists View Cards and reuses a returned card_ref for targeted detail", async () => {
    const registry = new ExtensionRegistry();
    registry.registerPlugin(planningPlugin);
    const cardId = "00000000-0000-4000-8000-000000000041";
    const secondCardId = "00000000-0000-4000-8000-000000000042";
    const snapshot = {
      viewKey: "test_planning",
      pluginVersion: "1.3.1",
      schemaVersion: "3",
      stateVersion: "1",
      observedAt: "2026-09-02T00:00:00.000Z",
      cards: [{
        id: cardId,
        viewKey: "test_planning",
        cardTypeKey: "WorkCard",
        dimensions: { title: "周常训练" },
        slots: {},
        relatedObjectIds: [],
      }, {
        id: secondCardId,
        viewKey: "test_planning",
        cardTypeKey: "WorkCard",
        dimensions: { title: "院系杯" },
        slots: {},
        relatedObjectIds: [],
      }],
      references: [{
        ref: "V1",
        label: "测试计划",
        target: { kind: "view" as const, viewKey: "test_planning" },
      }, {
        ref: "V2",
        label: "测试计划 / WorkCard",
        target: {
          kind: "card" as const,
          viewKey: "test_planning",
          cardId,
        },
      }, {
        ref: "V3",
        label: "测试计划 / WorkCard",
        target: {
          kind: "card" as const,
          viewKey: "test_planning",
          cardId: secondCardId,
        },
      }],
    };
    const evidence = new MemoryEvidenceAccumulator({
      query: "",
      mode: "object-assertion",
      seedMap: { facets: [], objects: [], assertions: [], connections: [] },
    });
    const onListObserved = vi.fn();
    const runtime = createViewStateRuntime({
      registry,
      evidence,
      userQuery: "社团概览里有什么",
      readSnapshot: vi.fn().mockResolvedValue(snapshot),
      resolveCardReference: (ref) => ref === "V2"
        ? { ref, label: "测试计划 / WorkCard", viewKey: "test_planning", cardId }
        : undefined,
      presentCards: (cards) => cards.map((card) => ({
        ref: card.id === cardId ? "V2" : "V3",
        cardTypeKey: card.cardTypeKey,
        dimensions: card.dimensions,
        slots: {},
        relatedObjectRefs: [],
      })),
      onObserved: vi.fn(),
      onListObserved,
    });

    const listed = await runtime.list({
      viewKey: "test_planning",
      offset: 0,
      limit: 1,
    });
    expect(listed.output).toMatchObject({
      selection: { matchedCount: 2, returnedCount: 1, truncated: true, nextOffset: 1 },
      cards: [{ ref: "V2", dimensions: { title: "周常训练" } }],
    });
    expect(onListObserved).toHaveBeenCalledWith(expect.objectContaining({
      matchedCardCount: 2,
      coverage: expect.objectContaining({ level: "partial" }),
    }));

    await runtime.list({
      viewKey: "test_planning",
      offset: 1,
      limit: 1,
    });
    expect(onListObserved).toHaveBeenLastCalledWith(expect.objectContaining({
      matchedCardCount: 2,
      coverage: expect.objectContaining({ level: "complete", observationComplete: true }),
    }));

    const read = await runtime.read({
      viewKey: "test_planning",
      question: "读取这张 Card 的详细状态",
      targets: [{ kind: "card_ref", value: "V2" }],
    });
    expect(read.output).toMatchObject({
      targets: ["测试计划 / WorkCard"],
      matchingCards: [{ ref: "V2", dimensions: { title: "周常训练" } }],
    });
  });
});
