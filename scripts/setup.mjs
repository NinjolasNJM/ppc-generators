import { access, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";

const nextEnvPath = path.join(process.cwd(), "next-env.d.ts");

const nextEnvContents = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript
`;

async function ensureFileExists(filePath, contents) {
  try {
    await access(filePath, constants.F_OK);
    return false;
  } catch {
    await writeFile(filePath, contents, "utf8");
    return true;
  }
}

const createdNextEnv = await ensureFileExists(nextEnvPath, nextEnvContents);

if (createdNextEnv) {
  console.log("Created next-env.d.ts");
} else {
  console.log("next-env.d.ts already present");
}
