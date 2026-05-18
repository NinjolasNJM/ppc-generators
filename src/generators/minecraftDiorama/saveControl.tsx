"use client";

import React from "react";

import { type Generator } from "@genroot/builder/modules/generator";
import { makeButtonClassNames } from "@genroot/builder/ui/button/buttonStyles";
import {
  dioramaSaveStatusInputId,
  encodeDioramaSave,
  exportDioramaSave,
  importDioramaSave,
} from "./save";

export function defineDioramaSaveInput(generator: Generator) {
  const saveJson = encodeDioramaSave(exportDioramaSave(generator));
  const status = generator.getStringInputValue(dioramaSaveStatusInputId);

  generator.defineCustomStringInput(dioramaSaveStatusInputId, (onChange) => (
    <DioramaSaveControl
      json={saveJson}
      status={status}
      onImport={(json) => {
        importDioramaSave(generator, json)
          .then((result) => {
            onChange(result.message);
          })
          .catch(() => {
            onChange("Import failed: the saved textures could not be loaded.");
          });
      }}
    />
  ));
}

function DioramaSaveControl({
  json,
  status,
  onImport,
}: {
  json: string;
  status: string | null;
  onImport: (json: string) => void;
}) {
  const fileInputId = React.useId();
  const href = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  const buttonClassName = makeButtonClassNames({
    size: "Small",
    color: "Blue",
  });

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <a
        href={href}
        download="minecraft-diorama.json"
        className={makeButtonClassNames({ size: "Small", color: "Green" })}
        title="Export Diorama JSON"
        aria-label="Export Diorama JSON"
      >
        Export JSON
      </a>
      <label
        htmlFor={fileInputId}
        className={buttonClassName}
        title="Import Diorama JSON"
        aria-label="Import Diorama JSON"
      >
        <input
          id={fileInputId}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) {
              return;
            }

            file.text().then(onImport).catch(() => {
              onImport("");
            });
          }}
        />
        Import JSON
      </label>
      {status ? <span className="text-sm text-gray-700">{status}</span> : null}
    </div>
  );
}
