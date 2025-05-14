import type { FormatEnum } from 'sharp'

export type ImageFormat = keyof FormatEnum

export interface PicpressOptions {
  /**
   * 入口文件或文件夹路径，支持单个路径或路径数组
   */
  entry: string | string[]

  /**
   * 输出目录
   * @default './.picpress'
   */
  output?: string

  /**
   * 是否覆盖原文件
   * @default false
   */
  overwrite?: boolean

  /**
   * 自定义输出文件名
   * @param filename 源文件名（含路径，例：'image'）
   * @returns 新文件名（例：'new-image'）
   */
  filename?: (filename: string) => string

  /**
   * 目标输出图片格式，默认为原图片格式
   * @default undefined
   */
  targetFormat?: ImageFormat

  /**
   * 需要转换的源图片格式过滤器
   * @default ['jpeg', 'jpg', 'png', 'webp', 'avif']
   */
  sourceFormats?: ImageFormat[]

  /**
   * 最小文件大小（单位：KB），仅对大于等于该值的图片进行压缩
   * @default 1024
   */
  minFileSize?: number

  /**
   * 压缩质量（0-100）
   * @default 80
   */
  quality?: number

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
}

export interface compressAndConvertContext {
  quality: number
  targetFormat: ImageFormat
  preserveMetadata: boolean
}
