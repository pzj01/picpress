import type { OutputInfo, Sharp } from 'sharp'
import type { CompressOptions, ImageFormat, PicpressOptions, TransformOptions } from './types'
import { existsSync, mkdirSync, rm, statSync } from 'node:fs'
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

export class PicPress {
  options: Required<PicpressOptions>
  paths: string[]
  constructor(options: PicpressOptions) {
    this.options = Object.assign({
      output: './.picpress',
      sourceFormats: defaultSourceFormats,
      recursive: true,
      overwrite: false,
      filename: (filename: string) => filename,
      minFileSize: 1024,
      deleteOriginal: false,
      sharpCompressOptions: {
        quality: 80,
      },
      preserveMetadata: false,
    }, options) as Required<PicpressOptions>

    const {
      entry,
      output,
      sourceFormats,
      recursive,
      overwrite,
    } = this.options

    const entries = Array.isArray(entry) ? entry : [entry]
    const patterns = entries.map((entry) => {
      if (!existsSync(entry)) {
        throw new Error(redBright`Entry ${entry} does not exist`)
      }

      const stats = statSync(entry)
      return stats.isDirectory() ? sourceFormats.map(ext => join(entry, `**/*.${ext}`)) : entry
    }).flat()

    this.paths = fg.sync(patterns, { dot: true, deep: recursive ? Infinity : 1 })

    if (!overwrite && !existsSync(output)) {
      mkdirSync(output, { recursive: true })
    }
  }

  async compress(path: string, options?: CompressOptions): Promise<OutputInfo[]>
  async compress(options?: CompressOptions): Promise<OutputInfo[]>
  async compress(...args: any[]): Promise<OutputInfo[]> {
    const {
      output,
      overwrite,
      filename,
      sharpCompressOptions,
      preserveMetadata,
    } = {
      ...this.options,
      ...(args.length === 1 ? args[0] : args[1]),
    } as Required<PicpressOptions>
    const path: string = args.length === 1 ? args[0] : ''
    const paths = path ? [path] : this.paths

    const promises = paths.map((path, i) => {
      if (this.isSupported(path)) {
        let dir = output
        let fname = basename(path)
        const ext = extname(fname)

        if (overwrite) {
          dir = dirname(path)
        }
        else {
          fname = `${filename(basename(fname, ext), i)}${ext}`
        }

        const newPath = join(dir, fname)
        this.log(path, newPath)

        const s = sharp(path)
        s.toFormat(ext.slice(1) as ImageFormat, sharpCompressOptions)

        if (preserveMetadata) {
          s.withMetadata()
        }

        return this.toFile(s, newPath)
      }
    })

    const results = await Promise.all(promises)

    console.log(`✅ All images processed ${greenBright('successfully')}. ${results.length} images processed.`)

    return results.filter(Boolean) as OutputInfo[]
  }

  async transform(path: string, options?: TransformOptions): Promise<OutputInfo[]>
  async transform(options?: TransformOptions): Promise<OutputInfo[]>
  async transform(...args: any[]): Promise<OutputInfo[]> {
    const {
      output,
      filename,
      targetFormat,
    } = {
      ...this.options,
      ...(args.length === 1 ? args[0] : args[1]),
    } as Required<PicpressOptions>

    const path: string = args.length === 1 ? args[0] : ''
    const paths = path ? [path] : this.paths
    const promises = paths.map((path, i) => {
      if (this.isSupported(path)) {
        let dir = output
        let fname = basename(path)
        const originalExt = extname(fname)
        const format = targetFormat || originalExt.slice(1) as ImageFormat

        if (originalExt === `.${format}`)
          return

        if (output === 'original') {
          dir = dirname(path)
        }
        else {
          fname = `${filename(basename(fname, originalExt), i)}.${format}`
        }
        const newPath = join(dir, fname)
        this.log(path, newPath)
        const s = sharp(path)
        s.toFormat(format)

        return this.toFile(s, newPath)
      }
    })

    const results = await Promise.all(promises)

    console.log(`✅ All images processed ${greenBright('successfully')}. ${results.length} images processed.`)

    return results.filter(Boolean) as OutputInfo[]
  }

  protected log(path: string, newPath: string): void {
    if (this.options.overwrite)
      return
    console.log(`🌁 Processing ${blueBright(path)} → ${greenBright(newPath)}`)
  }

  protected isSupported(path: string): boolean {
    const { size } = statSync(path)
    return (size / 1024) >= this.options.minFileSize
  }

  protected toFile(sharp: Sharp, path: string): Promise<OutputInfo> {
    const { deleteOriginal } = this.options

    if (deleteOriginal) {
      rm(path, { force: true }, () => {
        console.log(`❌ Deleted original file ${redBright(path)}`)
      })
    }

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
}

export function defineConfig(config: PicpressOptions): PicpressOptions {
  return config
}
