import { describe, expect, it } from "vitest";
import { minecraftTextureVersionDefinitions } from "./minecraftTextureVersions";

describe("minecraft texture version definitions", () => {
  it("collects the shared minecraft block and item texture sources", () => {
    expect(minecraftTextureVersionDefinitions).toHaveLength(10);
    expect(minecraftTextureVersionDefinitions[0]?.[0].textureDef.id).toBe(
      "minecraft-1.7.10-items"
    );
    expect(minecraftTextureVersionDefinitions.at(-1)?.[0].textureDef.id).toBe(
      "minecraft-26.1.2-blocks"
    );
  });
});
