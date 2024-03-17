import { PdfConvert } from "pdf-convert-js";
import fs, { promises as fsp } from "node:fs";
import Jimp from 'jimp';

async function convertPDF(file) {
  const pdfConverter = new PdfConvert(`./data/PDF/${file}.pdf`);

  // ! this is faster way, but will use too much memory
  // let tasks = new Array<Promise<void>>();
  // let convert = async (i: number) => {
  //   let buffer: Buffer = await pdfConverter.convertPageToImage(i);
  //   await fsp.writeFile(`./data/PNG/${file.split(".")[0]}_${i}.png`, buffer);
  // }
  
  // for (let i = 1, maxi = await pdfConverter.getPageCount(); i <= maxi; ++i)
  //   tasks.push(convert(i));
  // for (let t of tasks)
  //   await t;

  // * slower way
  for (let i = 1; true; ++i) {
    let buffer: Buffer = await pdfConverter.convertPageToImage(i);
    if (buffer.length === 0) break;

    await fsp.writeFile(`./data/PNG/${file}_${i}.png`, buffer);
    console.log(`Converted Page ${i}`);
  }

  pdfConverter.dispose();
}

async function genPDFs(removeOld = true) {
  if (removeOld)
    for (let file of await fsp.readdir("./data/PNG")) {
      await fsp.unlink(`./data/PNG/${file}`);
    }

  for (let file of await fsp.readdir("./data/PDF")) {
    convertPDF(file.split(".")[0]);
  }
}

enum Colors {
  BACKGROUND = 0xFFFFFFFF,
  STARTER    = 0x339966FF,
  ENDER      = 0xFF6600FF
}

enum Settings {
  EDGE_SHRINK     = 175,
  WHITESPACE_ADD  = 70
}
  
enum PixelState {
  NORMAL = 0,
  START  = 1,
  END    = 2
}

enum Settings {
  JOIN_SHRINK_TOP = 345,
  JOIN_SHRINK_BOTTOM = 400
}

async function joinImages(image1: Jimp, image2: Jimp) {
  const newImage = new Jimp(
    image1.getWidth(), 
    image1.getHeight() + image2.getHeight() - Settings.JOIN_SHRINK_TOP - Settings.JOIN_SHRINK_BOTTOM
  );

  newImage.composite(image1, 0, 0);
  newImage.composite(
    image2.clone().crop(
      0, 
      Settings.JOIN_SHRINK_TOP, 
      image2.getWidth(),
      image2.getHeight() - Settings.JOIN_SHRINK_TOP
    ), 
    0, 
    image1.getHeight() - Settings.JOIN_SHRINK_BOTTOM
    );

  return newImage;
}

async function splitOne(file: string, n: number) {
  let thisImage = await Jimp.read(`./data/PNG/${file}_${n}.png`), nextImage: Jimp, image: Jimp;

  if (fs.existsSync(`./data/PNG/${file}_${n + 1}.png`)) {
    nextImage = await Jimp.read(`./data/PNG/${file}_${n + 1}.png`);
    image = await joinImages(thisImage, nextImage);
  }
  else {
    image = thisImage;
  }

  let lineStates = new Array<PixelState>();
  let currentLineState: PixelState;

  for (let y = 0; y < image.bitmap.height; ++y) {
    currentLineState = PixelState.NORMAL;
    for (let x = 0; x < image.bitmap.width; ++x) {
      if (image.getPixelColor(x, y) === Colors.STARTER) {
        currentLineState = PixelState.START;
        break;
      }
      if (image.getPixelColor(x, y) === Colors.ENDER) {
        currentLineState = PixelState.END;
        break;
      }
    }
    lineStates.push(currentLineState);
  }

  console.log(`Read ${image.bitmap.height} lines`);

  enum SplitState {
    OUTSIDE = 0,
    STARTING = 1,
    INSIDE = 2,
    ENDING = 3
  }

  type SubChunk = { start: number, end: number };
  let subChunks = new Array<SubChunk>();

  let splitState = SplitState.OUTSIDE;
  let currentSubChunk = { start: -1, end: -1 };

  for (let [ y, lineState ] of lineStates.entries()) {    
    switch (splitState) {
      case SplitState.OUTSIDE:
        if (lineState === PixelState.START) {
          if (y > thisImage.getHeight()) break;
          
          currentSubChunk.start = y;

          splitState = SplitState.STARTING;
        }
        break;
      case SplitState.STARTING:
        if (lineState === PixelState.NORMAL) {
          splitState = SplitState.INSIDE;
        }
        break;
      case SplitState.INSIDE:
        if (lineState === PixelState.END) {
          splitState = SplitState.ENDING;
        }
        break;
      case SplitState.ENDING:
        if (lineState === PixelState.NORMAL) {
          currentSubChunk.end = y;
          subChunks.push({ ...currentSubChunk });

          splitState = SplitState.OUTSIDE;
        }
        break;
    }
  }

  console.log(`${subChunks.length} sub-chunks generated:`);
  console.log(subChunks);

  for (let [ i, chunk ] of subChunks.entries()) {
    const newImage = new Jimp(
      /*   w: */ image.bitmap.width - 2 * Settings.EDGE_SHRINK,
      /*   h: */ chunk.end - chunk.start + Settings.WHITESPACE_ADD * 2, 
      /* col: */ 0xFFFFFFFF
    );

    newImage.composite(
      image.clone().crop(
        /* x: */ Settings.EDGE_SHRINK, 
        /* y: */ chunk.start,
        /* w: */ image.bitmap.width - 2 * Settings.EDGE_SHRINK, 
        /* h: */ chunk.end - chunk.start
      ),
      /* x: */ 0, 
      /* y: */ Settings.WHITESPACE_ADD
    );

    newImage.writeAsync(`./data/Result/${file}_${n}_${i}.png`).then(() => {
      console.log(`Writed ${i}`);
    });
  }

  console.log("Done");
}

async function splitPNG(file: string, removeOld = true) {
  if (removeOld)
    for (let file of await fsp.readdir("./data/Result/")) {
      await fsp.unlink(`./data/Result/${file}`);
    }

  for (let i = 1; fs.existsSync(`./data/PNG/${file}_${i}.png`); ++i) {
    console.log(`Splitting page ${i}...`);
    await splitOne(file, i);
  }
}

async function main() {
  const FILE = "6-1";
  // await genPDF(FILE);
  await splitPNG(FILE);
}

main();
