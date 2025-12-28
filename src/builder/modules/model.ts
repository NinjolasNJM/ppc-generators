import { type ImageWithCanvas } from "./imageWithCanvas";
import { type Texture } from "./texture";
import { type Page, makePage } from "./modelPage";
import { makeUUID } from "./uuid";
import {
  type Control,
  type TextureInputControlProps,
  type Region,
} from "./modelControls";
import { type Variable } from "./variables";
import { type Values } from "./modelValues";
import { DEFAULT_SKIN_NAMES, getSkinUrl } from "@genroot/generators/_common/skins";

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

  addCustomInputControl(
    id: string,
    render: (onChange: (value: string) => void) => React.ReactNode
  ) {
    this.addControl({
      kind: "CustomInput",
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
      kind: "TextureInput",
      id,
      props,
    });
  }

  addBooleanInputControl(id: string, initialValue: boolean) {
    this.addControl({
      kind: "BooleanInput",
      id,
      initialValue,
    });
    const value = this.getBooleanVariable(id);
    if (value === null) {
      this.setBooleanVariable(id, initialValue);
    }
  }

  addSelectInputControl(id: string, options: string[]) {
    this.addControl({
      kind: "SelectInput",
      id,
      options,
    });
    const value = this.getStringVariable(id);
    const firstOption = options.at(0);
    if (value === null && firstOption) {
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
    const currentValue = this.getNumberVariable(id);
    if (currentValue === null) {
      this.setNumberVariable(id, value);
    }
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
    console.log("Texture added:", id, texture.imageWithCanvas.image.src);
    console.log("Texture is bundled default:", this.isTextureDefaultBundleId(id));
  }

  findTexture(id: string): Texture | null {
    return this.values.textures.get(id) || null;
  }

  hasTexture(id: string): boolean {
    return this.findTexture(id) !== null;
  }

  /**
   * isTextureDefaultBundle
   * Check whether a given Texture object matches any of the bundled
   * default skin URLs (wide/slim). Matching first tries full `src`
   * equality, then falls back to comparing the filename/base name so
   * hashed/static URLs still match.
   */
  isTextureDefaultBundle(texture: Texture): boolean {
    const src = texture.imageWithCanvas?.image?.src ?? "";
    if (!src) return false;
    const base = src.split("/").pop() ?? src;
    const names = Array.from(DEFAULT_SKIN_NAMES as unknown as string[]);
    for (const name of names) {
      const wide = getSkinUrl(name, "Wide");
      const slim = getSkinUrl(name, "Slim");
      if (src === wide || src === slim) return true;
      if ((wide.split("/").pop() ?? "") === base) return true;
      if ((slim.split("/").pop() ?? "") === base) return true;
    }
    return false;
  }

  /**
   * isTextureDefaultBundleId
   * Convenience wrapper that accepts a texture id and returns whether the
   * corresponding texture (if present) matches a bundled default.
   */
  isTextureDefaultBundleId(id: string): boolean {
    const texture = this.findTexture(id);
    if (!texture) return false;
    return this.isTextureDefaultBundle(texture);
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

  cleatAllVariables(): void {
    this.values.clearAllVariables();
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

  setCurrentPage(page: Page) {
    this.currentPage = page;
  }

  getCurrentPage(): Page {
    if (this.currentPage) {
      return this.currentPage;
    }

    const newPage = makePage("Page");

    this.addPage(newPage);
    this.setCurrentPage(newPage);

    return newPage;
  }

  usePage(id: string) {
    const page = this.findPage(id);
    if (page) {
      this.setCurrentPage(page);
      return;
    }

    const newPage = makePage(id);

    this.addPage(newPage);
    this.setCurrentPage(newPage);

    return newPage;
  }
}
