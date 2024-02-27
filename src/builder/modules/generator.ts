import { type Model, type Control_Texture_Props } from "./model";
import { type DrawTextureOptions, drawTexture } from "./renderers/drawTexture";
import { type Page, makePage } from "./page";

export class Generator {
  model: Model;

  constructor(model: Model) {
    this.model = model;
  }

  getCurrentPage(): Page {
    const currentPage = this.model.currentPage;
    if (currentPage) {
      return currentPage;
    }

    const page = makePage("Page");
    this.model.addPage(page);
    this.model.setCurrentPage(page);
    return page;
  }

  defineTextureInput(id: string, props: Control_Texture_Props): void {
    this.model.addTextureControl(id, props);
  }

  defineBooleanInput(id: string, initialValue: boolean): void {
    this.model.addBooleanControl(id, initialValue);
  }

  defineSelectInput(id: string, options: string[]): void {
    this.model.addSelectControl(id, options);
  }

  defineText(text: string): void {
    this.model.addTextControl(text);
  }

  getBooleanInputValue(id: string): boolean | null {
    return this.model.getBooleanVariable(id);
  }

  getBooleanInputValueWithDefault(id: string, defaultValue: boolean): boolean {
    return this.model.getBooleanVariable(id) ?? defaultValue;
  }

  getSelectInputValue(id: string): string | null {
    return this.model.getStringVariable(id);
  }

  setNumberVariable(id: string, value: number): void {
    this.model.setNumberVariable(id, value);
  }

  getNumberVariable(id: string): number | null {
    return this.model.getNumberVariable(id);
  }

  drawImage(id: string, [x, y]: [number, number]): void {
    const page = this.getCurrentPage();
    const image = this.model.findImage(id);

    if (!image) {
      return;
    }

    page.canvasWithContext.context.drawImage(image.image, x, y);
  }

  drawTexture(
    id: string,
    [sx, sy, sw, sh]: [number, number, number, number],
    [dx, dy, dw, dh]: [number, number, number, number],
    { flip, rotate, blend, pixelate }: DrawTextureOptions = {}
  ): void {
    const currentPage = this.getCurrentPage();
    const texture = this.model.findTexture(id);

    if (!texture) {
      return;
    }

    drawTexture(
      currentPage.canvasWithContext,
      texture,
      [sx, sy, sw, sh],
      [dx, dy, dw, dh],
      {
        flip,
        rotate,
        blend,
        pixelate,
      }
    );
  }
}
