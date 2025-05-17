# Introduction

Image compression and format conversion tools

## Install

```bash
pnpm add @pzj01/picpress
```

## Usage

### Config

use `picpress.config.js` or `picpress.config.ts`

```ts
import { defineConfig } from '@pzj01/picpress'

export default defineConfig({
  entry: '.image', // entry file or folder path
  output: './.picpress', // output directory
  minFileSize: 0, // handle images larger than or equal to this value
  recursive: true, // whether to recursively find images in subfolders
  overwrite: true // whether to overwrite existing files
})
```

### Compress

compress images.

```ts
import { PicPress } from '@pzj01/picpress'

const pic = new PicPress({
  entry: '.image',
  output: './.picpress',
  minFileSize: 0,
  recursive: true,
  overwrite: true
})

await pic.compress() // use default config
await pic.compress({
  quality: 60
}) // compress all images with quality 60
await pic.compress('./image', {
  quality: 60
}) // compress ./image with quality 60
```

### Transform

transform images format.

```ts
import { PicPress } from '@pzj01/picpress'

const pic = new PicPress({
  entry: '.image',
  output: './.picpress',
  minFileSize: 0,
  recursive: true,
})

await pic.transform() // use default config
await pic.transform({
  targetFormat: 'webp'
}) // transform all images to webp
await pic.transform('./image', {
  targetFormat: 'webp'
}) // transform ./image to webp
```

### CLI

use `@pzj01/picpress` in command line

```bash
pnpm dlx @pzj01/picpress compress
```

or install afterward use

```bash
pnpm @pzj01/picpress compress
```

#### Commands

- `picpress compress`: compress images

```bash
pnpm @pzj01/picpress compress --entry .image --quality 60 --overwrite
```

- `picpress transform`: transform images format

```bash
pnpm @pzj01/picpress transform --entry .image --target-format webp
```

#### Global Options

- `--entry [...paths]`: entry file or folder path, support single path or path array
- `--output <output>`: output directory
- `--minFileSize <size>`: handle images larger than or equal to this value
- `--source-formats [...formats]`: source image formats filter
- `--recursive`: whether to recursively find images in subfolders
- `--delete-original`: whether to delete the original file

#### Compress Options

- `--quality <quality>`: image quality
- `--preserve-metadata`: whether to keep the original image metadata
- `--overwrite`: whether to overwrite the original file

#### Transform Options

- `--target-format <format>`: target image format
