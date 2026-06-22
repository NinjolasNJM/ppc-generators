import { type Generator } from "@genroot/builder/modules/generator";
import { type Dimensions, type Position, type Rectangle } from "./cuboid";
import { type Orientation } from "./minecraft";

export type CuboidFoldType = "normal" | "light";

export type FoldLineOptions = {
  foldType?: CuboidFoldType;
};

export type CuboidFoldOptions = FoldLineOptions & {
  orientation?: Orientation;
};

function drawFoldLine(
  generator: Generator,
  from: Position,
  to: Position,
  options: FoldLineOptions = {}
) {
  generator.drawFoldLine(from, to, options.foldType === "light");
}

export function drawRectangleFolds(
  generator: Generator,
  rectangle: Rectangle,
  options: FoldLineOptions = {}
) {
  const [x, y, w, h] = rectangle;

  drawFoldLine(generator, [x, y - 1], [x + w, y - 1], options);
  drawFoldLine(generator, [x + w, y], [x + w, y + h], options);
  drawFoldLine(generator, [x + w - 1, y + h], [x, y + h], options);
  drawFoldLine(generator, [x - 1, y + h - 1], [x - 1, y], options);
}

export function drawCuboidFolds(
  generator: Generator,
  position: Position,
  dimensions: Dimensions,
  options: CuboidFoldOptions = {}
) {
  const [x, y] = position;
  const [w, h, d] = dimensions;
  const orientation = options.orientation ?? "West";

  switch (orientation) {
    case "East": {
      drawRectangleFolds(generator, [x + w + d, y, w, d * 2 + h], options);
      drawRectangleFolds(generator, [x, y + d, d * 2 + w * 2, h], options);
      drawFoldLine(generator, [x + w, y + d], [x + w, y + d + h], options);
      break;
    }
    case "North": {
      drawRectangleFolds(generator, [x + d, y, w, d * 2 + h * 2], options);
      drawRectangleFolds(generator, [x, y + d, d * 2 + w, h], options);
      drawFoldLine(
        generator,
        [x + d, y + d * 2 + h - 1],
        [x + d + w, y + d * 2 + h - 1],
        options
      );
      break;
    }
    case "South": {
      drawRectangleFolds(generator, [x + d, y, w, d * 2 + h * 2], options);
      drawRectangleFolds(generator, [x, y + d + h, d * 2 + w, h], options);
      drawFoldLine(generator, [x + d, y + h], [x + d + w, y + h], options);
      break;
    }
    case "West": {
      drawRectangleFolds(generator, [x + d, y, w, d * 2 + h], options);
      drawRectangleFolds(generator, [x, y + d, d * 2 + w * 2, h], options);
      drawFoldLine(
        generator,
        [x + d * 2 + w - 1, y + d],
        [x + d * 2 + w - 1, y + d + h],
        options
      );
      break;
    }
  }
}
