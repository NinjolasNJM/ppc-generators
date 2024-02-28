import { type ImageWithCanvas } from "./imageWithCanvas";
import { type Texture } from "./texture";
import { type Page } from "./modelPage";
import { makeUUID } from "./uuid";
import {
  type Control,
  type TextureInputControlProps,
  type Region,
} from "./modelControls";
import { type Variable } from "./variables";
import { type Values } from "./modelValues";

export class Model {
  controls: Control[];
  pages: Page[];
  currentPage: Page | null;
  values: Values;

  constructor(values: Values) {
    this.controls = [];
    this.pages = [];
    this.currentPage = null;
    this.values = values;
  }

  addControl(control: Control) {
    this.controls.push(control);
  }

  addTextControl(text: string) {
    this.addControl({
      kind: "Text",
      id: makeUUID(),
      text,
    });
  }

  addCustomControl(
    id: string,
    render: (onChange: (value: string) => void) => React.ReactNode
  ) {
    this.addControl({
      kind: "Custom",
      id,
      render,
    });
  }

  addRegionControl(pageId: string, region: Region, onClick: () => void) {
    this.addControl({
      kind: "Region",
      pageId,
      region,
      onClick,
    });
  }

  addTextureControl(id: string, props: TextureInputControlProps) {
    this.addControl({
      kind: "Texture",
      id,
      props,
    });
  }

  addBooleanControl(id: string, initialValue: boolean) {
    this.addControl({
      kind: "Boolean",
      id,
      initialValue,
    });
  }

  addSelectControl(id: string, options: string[]) {
    this.addControl({
      kind: "Select",
      id,
      options,
    });

    const value = this.getStringVariable(id);
    const firstOption = options.at(0);
    if (!value && firstOption) {
      this.setStringVariable(id, firstOption);
    }
  }

  addRangeControl(
    id: string,
    min: number,
    max: number,
    value: number,
    step: number
  ) {
    this.addControl({
      kind: "Range",
      id,
      min,
      max,
      value,
      step,
    });
  }

  addButtonControl(id: string, onClick: () => void) {
    this.addControl({
      kind: "Button",
      id,
      onClick,
    });
  }

  addPage(page: Page) {
    this.pages.push(page);
  }

  findPage(id: string): Page | null {
    return this.pages.find((curr) => curr.id === id) || null;
  }

  addImage(id: string, image: ImageWithCanvas) {
    this.values.addImage(id, image);
  }

  findImage(id: string): ImageWithCanvas | null {
    return this.values.images.get(id) || null;
  }

  addTexture(id: string, texture: Texture) {
    this.values.addTexture(id, texture);
  }

  findTexture(id: string): Texture | null {
    return this.values.textures.get(id) || null;
  }

  removeTexture(id: string) {
    this.values.removeTexture(id);
  }

  setVariable(id: string, variable: Variable) {
    this.values.setVariable(id, variable);
  }

  setStringVariable(id: string, value: string): void {
    this.values.setStringVariable(id, value);
  }

  getStringVariable(id: string): string | null {
    return this.values.getStringVariable(id);
  }

  setNumberVariable(id: string, value: number): void {
    this.values.setNumberVariable(id, value);
  }

  getNumberVariable(id: string): number | null {
    return this.values.getNumberVariable(id);
  }

  setBooleanVariable(id: string, value: boolean): void {
    this.values.setBooleanVariable(id, value);
  }

  getBooleanVariable(id: string): boolean | null {
    return this.values.getBooleanVariable(id);
  }

  setCurrentPage(page: Page | null) {
    this.currentPage = page;
  }
}
