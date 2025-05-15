import type { AvifOptions, FormatEnum, GifOptions, HeifOptions, Jp2Options, JpegOptions, JxlOptions, OutputOptions, PngOptions, TiffOptions, WebpOptions } from 'sharp'

export type ImageFormat = keyof FormatEnum

type SharpCompressOptions = OutputOptions
  | JpegOptions
  | PngOptions
  | WebpOptions
  | AvifOptions
  | HeifOptions
  | JxlOptions
  | GifOptions
  | Jp2Options
  | TiffOptions

export interface CommonOptions {
  /**
   * 入口文件或文件夹路径，支持单个路径或路径数组
   */
  entry: string | string[]

  /**
   * 输出目录
   * @default './.picpress'
   */
  output?: string | 'original'

  /**
   * 自定义输出文件名
   * @param filename 源文件名（含路径，例：'image'）
   * @returns 新文件名（例：'new-image'）
   */
  filename?: (filename: string) => string

  /**
   * 需要处理的图片格式，支持单个格式或格式数组
   * @default defaultSourceFormats
   */
  sourceFormats?: ImageFormat[]

  /**
   * 最小文件大小（单位：KB），仅对大于等于该值的图片进行压缩
   * @default 1024
   */
  minFileSize?: number

  /**
   * 是否递归查找子文件夹中的图片
   * @default true
   */
  recursive?: boolean

  /**
   * 是否保留原始图片的元数据（移除元数据可以减小文件大小）
   * @default false
   */
  preserveMetadata?: boolean

  /**
   * 是否删除原文件，如果overwrite为true则忽略该选项
   * @default false
   */
  deleteOriginal?: boolean
}

export interface CompressOptions {
  /**
   * 是否覆盖原文件，如果启用将忽略输出目录
   * @default false
   */
  overwrite?: boolean

  sharpCompressOptions?: SharpCompressOptions
}

export interface TransformOptions {
  /**
   * 目标输出图片格式，默认为原图片格式
   * @default undefined
   */
  targetFormat?: ImageFormat
}

export type PicpressOptions = CommonOptions & TransformOptions & CompressOptions

export interface compressAndConvertContext {
  compressOptions: SharpCompressOptions
  targetFormat: ImageFormat
  preserveMetadata: boolean
}
