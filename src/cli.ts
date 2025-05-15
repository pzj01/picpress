#!/usr/bin/env node
import type { PicpressOptions } from './types'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { blueBright, cyanBright, greenBright, redBright } from 'ansis'
import cac from 'cac'
import { createJiti } from 'jiti'
import { name, version } from '../package.json'
import { defaultSourceFormats, PicPress } from './picpress'

const configFiles = [
  'picpress.config.js',
  'picpress.config.ts',
  'picpress.config.json',
] as const
const cli = cac(cyanBright(name))

cli.usage(`[options], or use ${greenBright('picpress.config.js/ts')} file`)

cli
  .option('--entry [...paths]', 'entry file or folder path, support single path or path array', { type: [] })
  .option('--output <output>', 'output directory', { default: './.picpress' })
  .option('--source-formats [...formats]', 'source image formats filter', { default: defaultSourceFormats, type: [] })
  .option('--recursive', 'whether to recursively find images in subfolders', { default: true })
  .option('--min-file-size <size>', 'minimum file size (unit: KB), only compress images larger than or equal to this value', { default: 1024 })
  .option('--delete-original', 'whether to delete the original file, if overwrite is true, this option will be ignored', { default: false })

cli
  .command('compress', 'compress images')
  .alias('c')
  .option('--quality <quality>', 'image quality', { default: 80 })
  .option('--preserve-metadata', 'whether to keep the original image metadata', { default: false })
  .option('--overwrite', 'whether to overwrite the original file', { default: false })
  .action(async (_options) => {
    const config = await readConfigFile()
    const options = {
      ..._options,
      sharpCompressOptions: {
        quality: _options.quality,
      },
      ...config,
    }

    if (!options.entry) {
      console.log(redBright('Please specify the entry file or folder path'))
      return
    }

    const pic = new PicPress(options)
    await pic.compress()
    console.log(greenBright('Compress completed 😈'))
  })

cli.command('transform', 'transform images format')
  .alias('t')
  .option('--target-format <format>', 'target image format', { default: 'webp' })
  .action(async (_options) => {
    const config = await readConfigFile()
    const options = {
      ..._options,
      ...config,
    }

    if (!options.entry) {
      console.log(redBright('Please specify the entry file or folder path'))
      return
    }

    const pic = new PicPress(options)
    await pic.transform()
    console.log(greenBright('Format completed 😈'),
    )
  })

cli.help()
cli.version(blueBright(version))
cli.parse()

async function readConfigFile(): Promise<PicpressOptions | undefined> {
  for (const configFile of configFiles) {
    const path = join(process.cwd(), configFile)
    if (existsSync(path)) {
      if (configFile.endsWith('.json'))
        return JSON.parse(readFileSync(path, 'utf-8'))

      if (configFile.endsWith('.ts')) {
        const jiti = createJiti(import.meta.url, {
          fsCache: true,
          moduleCache: true,
        })
        return await jiti.import(path)
      }

      return (await import(path)).default
    }
  }
}
