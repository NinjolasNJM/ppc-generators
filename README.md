# Pixel Papercraft Generators

# Making a Generator
- Start with an existing generator in the src/generators folder and duplicate it.
- Change its files' names wherever applicable. in the main .ts file, change the id and name.
- To make it appear on the page, add it to a category in generators.ts.
- If it still doesnt work, look for places where things need to be renamed or mentioned.
- Do not use legacy functions like drawTextureLegacy

# Adding Images or Textures
- Images and textures need to be added to the respective folder in the generator.
- Textures can be transformed (resized, rotated, etc) while images cannot, this is mostly for optimization. Usually textures are game textures while images are backgrounds, fold lines, labels, etc.
- In the generator's script, there should be arrays images and textures which require the id string to use in the code and the url which it refers to. Textures also have a default height and width to specify.

# Drawing Images
- Image can be drawn like:

`generator.drawImage("Background", [0, 0]);`

# Drawing Textures
- Textures can be drawn like:

`generator.drawTexture( "Skin", [sx, sy, sw, sh], [dx, dy, dw, dh], { flip: "None", rotate: 0.0, blend: { kind: "MultiplyHex", hex: tint }, pixelated: "None"});`
- Where the options flip, rotate, blend, and pixelate are optional but can be useful.

# Drawing Minecraft Cuboids
- Most Minecraft entity textures organize faces of different cuboid parts the same way on skins. because of this there exists a function for drawing all six sides in the right place easily:

`minecraftGenerator.drawCuboid(
        "Skin",
        char.overlay.leftLeg,
        [ox, oy],
        dimensions,
        { orientation: "East" }
      );`

- there is also a library of the cuboids on the minecraft player skin, which above is referenced as `char`. You can make your own that are like this too. Otherwise the cuboid is like:

`translate(cuboid([8, 8, 8]), [0, 0])`
- I'm not actually sure about that, every time I have used cuboids I hav made a atlas of the cuboids just because it's makes it much much easier.

# Inputs
- There are a lot of types of inputs, these being:
- 1. texture: `  generator.defineTextureInput("Skin", {
    standardWidth: 64,
    standardHeight: 64,
    choices: [],
    enableMinecraftSkinInput: true,
  });` enable minecraft skin input allows for searching by minecraft username
- 2. select `generator.defineSelectInput("Skin Model", ["Steve", "Alex"]);` associates a latter string with the former string, whioch can then be read using `generator.getSelectInputValue("Skin Model")`
  3. boolean `generator.defineBooleanInput("Show Folds", true);` associates the boolean with a string, can get it with `generator.getBooleanInputValue("Show Folds"); `
  4. region `  generator.defineRegionInput([ox, oy, 256, 192], () => {
    generator.setBooleanInputValue("Show Head Overlay", !showHeadOverlay);
  });` params are a rectangle on the output page, which when clicked will execute the specified function.
  5. range `generator.defineAndGetRangeInput(
        textureId + " Body Height",
        { min: 0, max: 64, value: 32, step: 1 }
      );` creates a slider that associates string with an int. btw, most of these have 'defineANdGet' and 'getWithDefault" variants that work like you would assume. there isnt really reason not to use them lolllllllllll
  6. button: A lot like region but on the inputs bar instead of the page. no good examples.
  7. CustomStringInput: A magical input that can do anything you want it to do but is pretty complex because of that. Only used for the block item etc generators but can do some insane stuff I just cant explain everythng about it ok

# How It should be laid out
  - If you are making a new generator or remaking an old one, a lot of them are made the wrong way. look at newer ones, namely the Action Figure Generator, for an easy and unconfucing way to make the generators so that it is also easier to edit in the future.
  - 1. Define images & textures
    2. In script, define Minecraft generator folder.
    3. define the skin input- the model type toggle and the texture inpit (with skin mode if it uses one)
    4. Define user variables
    5. Get User Variable values, including for region inputs
    6. functions for each part to be drawn, using draw cuboid function
    7. All parts that have overlays should have a region input toggle on them. This is minimalistic and prefents the whole top input bar from being covered with these toggles but leaves them available for those who use them.
    8. define an [ox, oy] to use as a reference point that is easily movable for each part. For the action figure I also made the getGridOrigin() function to get the coords as part of the grid that I made the design on. You could use this function if it is convenient ut it wont be on every design.
    9. draw each part in the right location depending on ox and oy, and define the region inputs.
    10. draw the foreground. There is no need to use a background over a foreground, and a foreground allows you to cut out parts of tectures that dont need to be seen very easily unlike if you had a background, where you would still need to use a foreground.
    11. Draw folds. There is a function for drawing fold lines that you can use as part of a drawFolds function but usually an image will suffice. A generator should always have optional folds, and they should not have one pixel gaps that make fold lines required.
    12. Draw Labels. Much like folds, every design should have optional labels.

  # Other things to know:
  - defineText(text)- put text in top bar
  - generator.drawText()- put text on page, better to use image though except if it needs to be dynamic
  - generator.fillRectangle()- draw a rectagle of anny size and color on the page
  - generator,fillBackground Color()- what it sahys on the tin
  - generrator.drawLine()- also in drawFoldLine form for when to draw the one line style meaant for folds
  - usePage(): add new pages i forgot how to use it

  - 