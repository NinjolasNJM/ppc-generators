import { describe, expect, it } from "vitest";
import { textureDefs, textureVersionIds } from "./textureVersions";

describe("minecraft block texture versions", () => {
  it("includes item textures in the shared picker list", () => {
    expect(textureDefs).toHaveLength(11);
    expect(textureVersionIds).toContain("custom");
    expect(textureVersionIds).toContain("minecraft-1.7.10-items");
    expect(textureVersionIds).toContain("minecraft-1.13.2-items");
    expect(textureVersionIds).toContain("minecraft-1.18.2-items");
    expect(textureVersionIds).toContain("minecraft-1.20.4-items");
    expect(textureVersionIds).toContain("minecraft-26.1.2-items");
  });
});
