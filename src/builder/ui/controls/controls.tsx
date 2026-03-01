import React from "react";

import { type Texture } from "@genroot/builder/modules/texture";
import { type Model } from "@genroot/builder/modules/model";
import { TextureControl } from "./textureControl";
import { BooleanControl } from "./booleanControl";
import { SelectControl } from "./selectControl";
import { RangeControl } from "./rangeControl";
import { ButtonControl } from "./buttonControl";
import { TextControl } from "./textControl";
import { MinecraftSkinControl } from "./minecraftSkinControl";
import {
  type MinecraftSkinSelection,
  getMinecraftSkinSelectionKey,
  minecraftSkinSelectionNone,
  parseMinecraftSkinSelection,
  serializeMinecraftSkinSelection,
} from "./minecraftSkinSelection";

export function Controls({
  model,
  onChange,
}: {
  model: Model;
  onChange: (model: Model) => void;
}) {
  const onTextureChange = (id: string, texture: Texture | null) => {
    if (texture) {
      model.addTexture(id, texture);
    } else {
      model.removeTexture(id);
    }
    onChange(model);
  };

  const onStringInputChange = (id: string, value: string) => {
    model.setStringVariable(id, value);
    onChange(model);
  };

  const onBooleanInputChange = (id: string, value: boolean) => {
    model.setBooleanVariable(id, value);
    onChange(model);
  };

  const onSelectInputChange = (id: string, value: string) => {
    model.setStringVariable(id, value);
    onChange(model);
  };

  const onRangeInputChange = (id: string, value: number) => {
    model.setNumberVariable(id, value);
    onChange(model);
  };

  const onMinecraftSkinSelectionChange = (
    id: string,
    selection: MinecraftSkinSelection
  ) => {
    model.setStringVariable(
      getMinecraftSkinSelectionKey(id),
      serializeMinecraftSkinSelection(selection)
    );
    onChange(model);
  };

  const onButtonControlClick = () => {
    onChange(model);
  };

  return (
    <div className="w-full bg-gray-100 p-8 mb-8">
      {model.controls.map((control) => {
        switch (control.kind) {
          case "Text": {
            return <TextControl key={control.id} text={control.text} />;
          }
          case "Region": {
            // Regions are handled in the page rendering code
            return null;
          }
          case "CustomInput": {
            return (
              <div key={control.id}>
                {control.render((value: string) => {
                  onStringInputChange(control.id, value);
                })}
              </div>
            );
          }
          case "TextureInput": {
            return (
              <TextureControl
                key={control.id}
                id={control.id}
                choices={control.props.choices}
                standardWidth={control.props.standardWidth}
                standardHeight={control.props.standardHeight}
                textures={model.values.textures}
                onChange={(texture) => onTextureChange(control.id, texture)}
              />
            );
          }
          case "MinecraftSkinInput": {
            const modelTypeId = control.props.modelTypeInputId;
            const modelTypeValue = model.getStringVariable(modelTypeId);
            const modelType = modelTypeValue === "Slim" ? "Slim" : "Wide";
            const storedSelection = parseMinecraftSkinSelection(
              model.getStringVariable(getMinecraftSkinSelectionKey(control.id))
            );
            const selection =
              storedSelection ??
              control.props.initialSelectedOption ??
              minecraftSkinSelectionNone;

            return (
              <MinecraftSkinControl
                key={control.id}
                id={control.id}
                options={control.props.options}
                standardWidth={control.props.standardWidth}
                standardHeight={control.props.standardHeight}
                modelType={modelType}
                selection={selection}
                textures={model.values.textures}
                onSelectionChange={(nextSelection) =>
                  onMinecraftSkinSelectionChange(control.id, nextSelection)
                }
                onChange={(texture) => onTextureChange(control.id, texture)}
              />
            );
          }
          case "BooleanInput": {
            const checked = model.getBooleanVariable(control.id) ?? false;
            return (
              <BooleanControl
                key={control.id}
                id={control.id}
                onChange={(value) => {
                  onBooleanInputChange(control.id, value);
                }}
                checked={checked}
              />
            );
          }
          case "SelectInput": {
            const value = model.getStringVariable(control.id) ?? "";
            return (
              <SelectControl
                key={control.id}
                id={control.id}
                options={control.options}
                value={value}
                onChange={(value) => onSelectInputChange(control.id, value)}
              />
            );
          }
          case "Button": {
            return (
              <ButtonControl
                key={control.id}
                id={control.id}
                onClick={() => {
                  control.onClick();
                  onButtonControlClick();
                }}
              />
            );
          }
          case "Range": {
            return (
              <RangeControl
                key={control.id}
                id={control.id}
                min={control.min}
                max={control.max}
                step={control.step}
                value={control.value}
                onChange={(value) => onRangeInputChange(control.id, value)}
              />
            );
          }
        }
      })}
    </div>
  );
}
