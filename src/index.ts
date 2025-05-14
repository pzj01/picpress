import type { OutputInfo, Sharp } from 'sharp'
import type { compressAndConvertContext, ImageFormat, PicpressOptions } from './types'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { blueBright, greenBright, redBright } from 'ansis'
import fg from 'fast-glob'
import sharp from 'sharp'

export const defaultSourceFormats: ImageFormat[] = [
  'jpeg',
  'jpg',
  'png',
  'webp',
  'avif',
  'gif',
  'heif',
  'svg',
  'raw',
  'tif',
  'tiff',
  'dz',
  'input',
  'jp2',
  'jxl',
  'magick',
  'openslide',
  'pdf',
  'ppm',
  'v',
]

export async function picpress(options: PicpressOptions): Promise<OutputInfo[]> {
  const {
    entry,
    output = './.picpress',
    overwrite = false,
    filename = (filename: string) => filename,
    targetFormat,
    sourceFormats = defaultSourceFormats,
    minFileSize = 1024,
    quality = 80,
    recursive = true,
    preserveMetadata = false,
  } = options

  const entries = Array.isArray(entry) ? entry : [entry]
  const patterns = entries.map((entry) => {
    if (!existsSync(entry)) {
      throw new Error(redBright`Entry ${entry} does not exist`)
    }
    const stats = statSync(entry)
    return stats.isDirectory() ? sourceFormats.map(ext => join(entry, `**/*.${ext}`)) : entry
  }).flat()

  // 需要转换的图片路径
  const paths = fg.sync(patterns, { dot: true, deep: recursive ? Infinity : 1 })

  // 输出的文件夹
  let dir = output
  let count = 0

  // 如果没有指定输出文件夹，则创建
  if (!overwrite && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const promises = paths.map(async (path) => {
    const { size } = await stat(path)
    if (size / 1024 <= minFileSize)
      return

    let fname = basename(path)
    const originalExt = extname(fname)
    const ext = targetFormat || originalExt.slice(1) as ImageFormat

    if (overwrite) {
      dir = dirname(path)
    }
    else {
      fname = `${filename(basename(fname, originalExt))}.${ext}`
    }

    const newPath = join(dir, fname)

    const s = sharp(path)

    console.log(`Processing ${blueBright(path)} → ${greenBright(newPath)}`)

    await compressAndConvert(s, {
      targetFormat: ext,
      quality,
      preserveMetadata,
    })

    count++
    return saveImage(s, newPath)
  })

  const results = await Promise.all(promises)
  const errors = results.filter(result => result instanceof Error)

  if (errors.length) {
    errors.forEach((error) => {
      console.log(redBright(error.message))
    })
  }

  console.log(`All images processed ${greenBright('successfully')}. ${count} images processed.`)

  return results.filter(Boolean) as OutputInfo[]
}

async function saveImage(sharp: Sharp, path: string): Promise<OutputInfo | Error> {
  return new Promise((resolve, reject) => {
    sharp.toFile(path, (err, info) => {
      if (err) {
        reject(err)
      }
      else {
        resolve(info)
      }
    })
  })
}

function compressAndConvert(sharp: Sharp, {
  targetFormat,
  quality,
  preserveMetadata,
}: compressAndConvertContext): Sharp {
  if (preserveMetadata) {
    sharp.withMetadata()
  }

  return sharp.toFormat(targetFormat, {
    quality,
  })
}
