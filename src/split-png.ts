import Jimp from 'jimp';

enum Colors {
  BACKGROUND = 0xFFFFFFFF,
  STARTER    = 0x339966FF,
  ENDER      = 0xFF6600FF
}

enum Settings {
  EDGE_SHRINK     = 175,
  WHITESPACE_ADD  = 70
}

async function splitImageByColor(imagePath: string): Promise<void> {
  const image = await Jimp.read(imagePath);

  enum PixelState {
    NORMAL = 0,
    START  = 1,
    END    = 2
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

    newImage.writeAsync(`./splitted/${i}.png`).then(() => {
      console.log(`Writed ${i}`);
    });
  }

  console.log("Done");
}

console.log("Started");

splitImageByColor('./output/6-1.png');
