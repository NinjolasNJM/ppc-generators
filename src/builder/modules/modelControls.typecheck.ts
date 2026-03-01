import type { MinecraftSkinInputControlProps } from "./modelControls";

// Type-level regression test: initialSelection must be provided.
// @ts-expect-error initialSelection is required for Minecraft skin controls
const missingInitialSelection: MinecraftSkinInputControlProps = {
  standardWidth: 64,
  standardHeight: 64,
  options: [],
  modelTypeInputId: "Model Type",
};

const validInitialSelection: MinecraftSkinInputControlProps = {
  standardWidth: 64,
  standardHeight: 64,
  options: [],
  modelTypeInputId: "Model Type",
  initialSelection: { kind: "none" },
};

void missingInitialSelection;
void validInitialSelection;
