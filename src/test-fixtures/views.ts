import { z } from "zod";

import { zodContractSchema, type PluginManifest, type ViewModule } from "@/contracts";

/** Minimal contracts for Runtime tests. These fixtures are never installed by the application. */
export function testView(key: string, label: string): ViewModule {
  return {
    manifest: {
      key, label, schemaVersion: "1", description: "Runtime test fixture",
      defaultSettings: { aiWritePolicy: "approval_required" },
    },
    schema: {
      viewKey: key, schemaVersion: "1",
      cardTypes: [{
        key: "WorkCard", label: "Work", description: "A synthetic work item",
        dimensions: [{ key: "name", label: "Name", type: "text" }],
        slots: [],
      }],
    },
    queries: [], commands: [], invariants: [], events: [],
  };
}

export const planningView: ViewModule = {
  ...testView("test_planning", "测试计划"),
  manifest: {
    ...testView("test_planning", "测试计划").manifest,
    retrievalDescription: "准备推进一项测试工作",
    aiWriteCapabilities: ["创建或更新具体工作"],
  },
  commands: [{
    key: "work.create", version: "1", label: "Create work",
    allowedInitiators: ["human", "ai"], requiredPermissions: ["view.write"],
    inputSchema: zodContractSchema(z.object({
      name: z.string(), status: z.string(), objectId: z.string().uuid().optional(),
    })),
    inputReferences: [{ path: ["objectId"], kind: "object", inferFromCanonicalNamePath: ["name"] }],
    execute: async () => { throw new Error("Runtime tests must mock the Command Bus"); },
  }, {
    key: "work.update", version: "1", label: "Update work",
    allowedInitiators: ["human", "ai"], requiredPermissions: ["view.write"],
    inputSchema: zodContractSchema(z.object({ workId: z.string().uuid(), progress: z.string() })),
    inputReferences: [{ path: ["workId"], kind: "card" }],
    execute: async () => { throw new Error("Runtime tests must mock the Command Bus"); },
  }],
};

export const planningPlugin: PluginManifest = {
  id: "test.planning", version: "1.0.0", contributes: { views: [planningView] },
};

export const directoryView: ViewModule = {
  ...testView("test_directory", "测试目录"),
  schema: {
    viewKey: "test_directory", schemaVersion: "1",
    cardTypes: [{
      key: "WorkCard", label: "Record", description: "A synthetic directory entry",
      dimensions: [{ key: "rating", label: "Rating", type: "text", description: "测试记录的正式等级，不是纯展示文字" }],
      slots: [],
    }],
  },
};

export const directoryPlugin: PluginManifest = {
  id: "test.directory", version: "1.0.0",
  contributes: { views: [directoryView] },
};

export const readOnlyPlugin: PluginManifest = {
  id: "test.read-only", version: "1.0.0",
  contributes: { views: [{
    ...testView("test_read_only", "只读记录"),
    manifest: {
      ...testView("test_read_only", "只读记录").manifest,
      dataBoundaries: ["AI 不能直接创建或修改外部记录"],
    },
  }] },
};
