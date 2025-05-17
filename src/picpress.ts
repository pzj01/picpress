import type { OutputInfo, Sharp } from 'sharp'
import type { CompressOptions, ImageFormat, PicpressOptions, TransformOptions } from './types'
import { existsSync, mkdirSync, renameSync, rm, statSync } from 'node:fs'
import { platform } from 'node:os'
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

const unit = platform() === 'darwin' ? 1000 : 1024

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

    let count = 1
    const path: string = args.length === 1 ? args[0] : ''
    const paths = path ? [path] : this.paths

    const promises = paths.map(async (path) => {
      if (this.isSupported(path)) {
        let dir = output
        let fname = basename(path)
        const ext = extname(fname)

        if (overwrite) {
          dir = dirname(path)
          fname = `${basename(fname, ext)}.temp${ext}`
        }
        else {
          fname = `${filename(basename(fname, ext), count)}${ext}`
        }

        const newPath = join(dir, fname)

        const s = sharp(path)
        s.toFormat(ext.slice(1) as ImageFormat, sharpCompressOptions)

        if (preserveMetadata) {
          s.withMetadata()
        }
        count++

        const result = await this.toFile(s, newPath)
        this.log(path, newPath, result)
        overwrite && renameSync(newPath, path)
        return result
      }
    })

    const results = await Promise.all(promises)

    console.log(`✅ All images processed ${greenBright('successfully')}. ${--count} images processed.`)

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

    let count = 1
    const path: string = args.length === 1 ? '' : args[0]
    const paths = path ? [path] : this.paths
    const promises = paths.map(async (path) => {
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
          fname = `${filename(basename(fname, originalExt), count)}.${format}`
        }
        const newPath = join(dir, fname)
        const s = sharp(path)
        s.toFormat(format)
        count++
        const result = await this.toFile(s, newPath)
        this.log(path, newPath, result)
        return result
      }
    })

    const results = await Promise.all(promises)

    console.log(`✅ All images processed ${greenBright('successfully')}. ${--count} images processed.`)

    return results.filter(Boolean) as OutputInfo[]
  }

  protected log(path: string, newPath: string, outputInfo?: OutputInfo): void {
    const stats1 = statSync(path)

    const stats2 = outputInfo || statSync(newPath)
    const size = stats1.size / unit ** 2
    const newSize = stats2.size / unit ** 2
    const diff = (size - newSize)
    const ratio = ((diff / size) * 100)

    if (!this.options.overwrite)
      console.log(`🌁 Processing ${blueBright(path)} → ${greenBright(newPath)}`)
    else
      console.log(`🌁 Processing ${blueBright(path)}`)
    console.log(`🪬 ${redBright`${size.toFixed(2)}MB`} → ${blueBright`${newSize.toFixed(2)}MB`} 😈, reduce ${greenBright`${diff.toFixed(2)}MB`}, compress ${greenBright`${ratio.toFixed(2)}%`} 🚀`)
  }

  protected isSupported(path: string): boolean {
    const { size } = statSync(path)
    return (size / unit) >= this.options.minFileSize
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
