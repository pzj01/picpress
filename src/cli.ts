#!/usr/bin/env node
import { blueBright, cyanBright, greenBright, redBright } from 'ansis'
import cac from 'cac'
import { name, version } from '../package.json'
import PicPress, { defaultSourceFormats } from './picpress'

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
  .action(async (options) => {
    if (!options.entry) {
      console.log(redBright('Please specify the entry file or folder path'))
      return
    }

    const pic = new PicPress({
      ...options,
      sharpCompressOptions: {
        quality: options.quality,
      },
    })
    await pic.compress()
    console.log(greenBright('Compress completed 😈'))
  })

cli.command('transform', 'transform images format')
  .alias('t')
  .option('--target-format <format>', 'target image format', { default: 'webp' })
  .action(async (options) => {
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
