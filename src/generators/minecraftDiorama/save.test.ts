import { describe, expect, it } from "vitest";

import { Generator } from "@genroot/builder/modules/generator";
import { Model } from "@genroot/builder/modules/model";
import { Values } from "@genroot/builder/modules/modelValues";
import {
  dioramaSaveStatusInputId,
  encodeDioramaSave,
  exportDioramaSave,
  importDioramaSave,
} from "./save";

function makeGenerator() {
  return new Generator(new Model(new Values()));
}

describe("diorama save import/export", () => {
  it("round trips string, number, and boolean generator state", async () => {
    const source = makeGenerator();
    source.setStringInputValue("DioramaDocument", '{"preset":"Quarter Blocks"}');
    source.setStringInputValue("BlockFace0 0", "stone-face-json");
    source.setStringInputValue("TabsNorth0 0", "2");
    source.setBooleanInputValue("FoldsEast0 0", true);
    source.setNumberVariable("Source X", 8.5);
    source.setStringInputValue(dioramaSaveStatusInputId, "This is UI-only.");

    const json = encodeDioramaSave(exportDioramaSave(source));
    const target = makeGenerator();
    target.setStringInputValue("BlockFace0 0", "old-value");

    const result = await importDioramaSave(target, json);

    expect(result.ok).toBe(true);
    expect(target.getStringInputValue("DioramaDocument")).toBe(
      '{"preset":"Quarter Blocks"}'
    );
    expect(target.getStringInputValue("BlockFace0 0")).toBe("stone-face-json");
    expect(target.getStringInputValue("TabsNorth0 0")).toBe("2");
    expect(target.getBooleanInputValue("FoldsEast0 0")).toBe(true);
    expect(target.getNumberVariable("Source X")).toBe(8.5);
    expect(target.getStringInputValue(dioramaSaveStatusInputId)).toBeNull();
  });

  it("leaves the current state alone when the imported JSON is invalid", async () => {
    const generator = makeGenerator();
    generator.setStringInputValue("BlockFace0 0", "stone-face-json");

    const result = await importDioramaSave(generator, "not json");

    expect(result.ok).toBe(false);
    expect(generator.getStringInputValue("BlockFace0 0")).toBe(
      "stone-face-json"
    );
  });
});
