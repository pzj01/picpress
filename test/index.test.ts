import { statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PicPress } from '../src/picpress'

describe('picPress', {
  timeout: Infinity,
  concurrent: true,
}, () => {
  const pic = new PicPress({
    entry: '.image',
    minFileSize: 0,
    recursive: true,
  })

  it('compress', async () => {
    const sizes = pic.paths.map((path) => {
      const { size } = statSync(path)
      return size
    })
    const results = await pic.compress()

    results.forEach(({ size }, i) => {
      expect(size).toBeLessThanOrEqual(sizes[i])
    })
  })

  it('transform', async () => {
    const results = await pic.transform({
      targetFormat: 'webp',
    })
    results.forEach(({ format }) => {
      expect(format).toBe('webp')
    })
  })
})
