import { type Generator } from "@genroot/builder/modules/generator";
import { makeTextureFromUrl } from "@genroot/builder/modules/texture";
import { type Variable } from "@genroot/builder/modules/variables";

export const dioramaSaveStatusInputId = "Diorama Save Status";

export type SavedTexture = {
  url: string;
  standardWidth: number;
  standardHeight: number;
};

export type DioramaSave = {
  version: 1;
  variables: Record<string, Variable>;
  textures?: Record<string, SavedTexture>;
};

export type DioramaImportResult =
  | {
      ok: true;
      message: string;
      save: DioramaSave;
    }
  | {
      ok: false;
      message: string;
    };

export function exportDioramaSave(generator: Generator): DioramaSave {
  const textures = exportDioramaTextures(generator);

  return {
    version: 1,
    variables: Object.fromEntries(
      Array.from(generator.model.values.variables.entries())
        .filter(([id]) => id !== dioramaSaveStatusInputId)
        .map(([id, variable]) => [id, cloneVariable(variable)])
    ),
    ...(Object.keys(textures).length > 0 ? { textures } : {}),
  };
}

export function encodeDioramaSave(save: DioramaSave): string {
  return `${JSON.stringify(save, null, 2)}\n`;
}

export async function importDioramaSave(
  generator: Generator,
  json: string
): Promise<DioramaImportResult> {
  const save = decodeDioramaSave(json);
  if (!save) {
    return {
      ok: false,
      message: "Import failed: choose a valid diorama JSON file.",
    };
  }

  generator.clearAllVariables();
  await importDioramaTextures(generator, save);
  Object.entries(save.variables).forEach(([id, variable]) => {
    switch (variable.kind) {
      case "String":
        generator.setStringInputValue(id, variable.value);
        break;
      case "Number":
        generator.setNumberVariable(id, variable.value);
        break;
      case "Boolean":
        generator.setBooleanInputValue(id, variable.value);
        break;
    }
  });

  const count = Object.keys(save.variables).length;
  const textureCount = Object.keys(save.textures ?? {}).length;
  return {
    ok: true,
    message:
      `Imported ${count} saved value${count === 1 ? "" : "s"}` +
      (textureCount > 0
        ? ` and ${textureCount} texture${textureCount === 1 ? "" : "s"}`
        : "") +
      ".",
    save,
  };
}

function decodeDioramaSave(json: string): DioramaSave | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed) || parsed.version !== 1) {
      return null;
    }

    if (!isRecord(parsed.variables)) {
      return null;
    }

    const variables = Object.fromEntries(
      Object.entries(parsed.variables)
        .filter(([id]) => id !== dioramaSaveStatusInputId)
        .map(([id, variable]) => [id, sanitizeVariable(variable)])
        .filter((entry): entry is [string, Variable] => entry[1] !== null)
    );

    const textures = sanitizeTextures(parsed.textures);

    return {
      version: 1,
      variables,
      ...(Object.keys(textures).length > 0 ? { textures } : {}),
    };
  } catch {
    return null;
  }
}

function sanitizeVariable(variable: unknown): Variable | null {
  if (!isRecord(variable)) {
    return null;
  }

  switch (variable.kind) {
    case "String":
      return typeof variable.value === "string"
        ? { kind: "String", value: variable.value }
        : null;
    case "Number":
      return typeof variable.value === "number" && Number.isFinite(variable.value)
        ? { kind: "Number", value: variable.value }
        : null;
    case "Boolean":
      return typeof variable.value === "boolean"
        ? { kind: "Boolean", value: variable.value }
        : null;
    default:
      return null;
  }
}

function exportDioramaTextures(
  generator: Generator
): Record<string, SavedTexture> {
  if (generator.getSelectInputValue("Version") !== "custom") {
    return {};
  }

  const texture = generator.getTexture("custom");
  const canvas = texture?.imageWithCanvas.canvasWithContext.canvas;
  if (!texture || !canvas) {
    return {};
  }

  return {
    custom: {
      url: canvas.toDataURL("image/png"),
      standardWidth: texture.standardWidth,
      standardHeight: texture.standardHeight,
    },
  };
}

async function importDioramaTextures(
  generator: Generator,
  save: DioramaSave
): Promise<void> {
  await Promise.all(
    Object.entries(save.textures ?? {}).map(async ([id, savedTexture]) => {
      const texture = await makeTextureFromUrl(
        savedTexture.url,
        savedTexture.standardWidth,
        savedTexture.standardHeight
      );
      generator.model.addTexture(id, texture);
    })
  );
}

function sanitizeTextures(
  textures: unknown
): Record<string, SavedTexture> {
  if (!isRecord(textures)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(textures)
      .map(([id, texture]) => [id, sanitizeTexture(texture)])
      .filter((entry): entry is [string, SavedTexture] => entry[1] !== null)
  );
}

function sanitizeTexture(texture: unknown): SavedTexture | null {
  if (!isRecord(texture)) {
    return null;
  }

  return typeof texture.url === "string" &&
    typeof texture.standardWidth === "number" &&
    Number.isFinite(texture.standardWidth) &&
    typeof texture.standardHeight === "number" &&
    Number.isFinite(texture.standardHeight)
    ? {
        url: texture.url,
        standardWidth: texture.standardWidth,
        standardHeight: texture.standardHeight,
      }
    : null;
}

function cloneVariable(variable: Variable): Variable {
  switch (variable.kind) {
    case "String":
      return { kind: "String", value: variable.value };
    case "Number":
      return { kind: "Number", value: variable.value };
    case "Boolean":
      return { kind: "Boolean", value: variable.value };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
