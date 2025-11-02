import { type Cuboid, makeCuboid, translateCuboid } from "./cuboid";

export type * from "./cuboid";

/* How the exported types look for a character:
  export type Layer = {
    head: Cuboid;
    rightArm: Cuboid;
    leftArm: Cuboid;
    body: Cuboid;
    rightLeg: Cuboid;
    leftLeg: Cuboid;
  };

  export type Character = {
    base: Layer;
    overlay: Layer;
  };
*/

const cuboid = makeCuboid;
const translate = translateCuboid;

export type Spider = {
  head: Cuboid;
  thorax: Cuboid;
  abdomen: Cuboid;
  leg: Cuboid;
};

export const spider: Spider = {
  head: translate(cuboid([8, 8, 8]), [32, 4]),
  thorax: translate(cuboid([6, 6, 6]), [0, 0]),
  abdomen: translate(cuboid([10, 8, 12]), [0, 12]),
  leg: translate(cuboid([16, 2, 2]), [18, 0]),
};

export type Sheep = {
  head: Cuboid;
  body: Cuboid;
  leg: Cuboid;
};

export const sheep: Sheep = {
  head: translate(cuboid([6,6,8]), [0,0]),
  body: translate(cuboid([8,16,6]), [28,8]),
  leg: translate(cuboid([4,12,4]), [0,16]),
};

export const wool: Sheep = {
  head: translate(cuboid([6,6,6]), [0,0]),
  body: translate(cuboid([8,16,6]), [28,8]),
  leg: translate(cuboid([4,6,4]), [0,16]),
};

export type Layer = {
  head: Cuboid;
  rightArm: Cuboid;
  leftArm: Cuboid;
  body: Cuboid;
  rightLeg: Cuboid;
  leftLeg: Cuboid;
};

export type Skeleton = {
  base: Layer;
  overlay: Layer;
};

export const skeleton: Skeleton = {
    base: {
  head: translate(cuboid([8, 8, 8]), [0, 0]),
    rightArm: translate(cuboid([2, 12, 2]), [40, 16]),
    leftArm: translate(cuboid([2, 12, 2]), [40, 16]),
    body: translate(cuboid([8, 12, 4]), [16, 16]),
    rightLeg: translate(cuboid([2, 12, 2]), [0, 16]),
    leftLeg: translate(cuboid([2, 12, 2]), [0, 16]),
    },
      overlay: {
    head: translate(cuboid([8, 8, 8]), [32, 0]),
    rightArm: translate(cuboid([2, 12, 2]), [40, 32]),
    leftArm: translate(cuboid([2, 12, 2]), [48, 48]),
    body: translate(cuboid([8, 12, 4]), [16, 32]),
    rightLeg: translate(cuboid([2, 12, 2]), [0, 32]),
    leftLeg: translate(cuboid([2, 12, 2]), [0, 48]),
  },
};

/* export const steve: Character = {
  base: {
    head: translate(cuboid([8, 8, 8]), [0, 0]),
    rightArm: translate(cuboid([4, 12, 4]), [40, 16]),
    leftArm: translate(cuboid([4, 12, 4]), [32, 48]),
    body: translate(cuboid([8, 12, 4]), [16, 16]),
    rightLeg: translate(cuboid([4, 12, 4]), [0, 16]),
    leftLeg: translate(cuboid([4, 12, 4]), [16, 48]),
  },
  overlay: {
    head: translate(cuboid([8, 8, 8]), [32, 0]),
    rightArm: translate(cuboid([4, 12, 4]), [40, 32]),
    leftArm: translate(cuboid([4, 12, 4]), [48, 48]),
    body: translate(cuboid([8, 12, 4]), [16, 32]),
    rightLeg: translate(cuboid([4, 12, 4]), [0, 32]),
    leftLeg: translate(cuboid([4, 12, 4]), [0, 48]),
  },
}; */

