import { describe, expect, it } from "vitest";
import { allTextureDefs, versionIds } from "./textureVersions";

describe("minecraft item texture versions", () => {
  it("includes the shared picker textures", () => {
    expect(allTextureDefs).toHaveLength(10);
    expect(versionIds).toContain("minecraft-1.7.10-items");
    expect(versionIds).toContain("minecraft-1.13.2-items");
    expect(versionIds).toContain("minecraft-1.18.2-items");
    expect(versionIds).toContain("minecraft-1.20.4-items");
    expect(versionIds).toContain("minecraft-26.1.2-items");
  });
});
