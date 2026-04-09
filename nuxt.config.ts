/// <reference types="node" />

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import type { Nitro } from 'nitropack'
import sharp from 'sharp'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const IMAGE_QUALITY = {
  jpg: 50,
  jpeg: 50,
  png: 50,
  webp: 50,
  avif: 55
} as const

async function collectImagePaths(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const filePaths = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directory, entry.name)

      if (entry.isDirectory()) {
        return collectImagePaths(fullPath)
      }

      const extension = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase()
      return IMAGE_EXTENSIONS.has(extension) ? [fullPath] : []
    })
  )

  return filePaths.flat()
}

async function compressBuiltImages(publicDir: string) {
  const imagePaths = await collectImagePaths(publicDir)
  let optimizedCount = 0
  let totalSavedBytes = 0

  await Promise.all(
    imagePaths.map(async (imagePath) => {
      const inputBuffer = await readFile(imagePath)
      const extension = imagePath.slice(imagePath.lastIndexOf('.') + 1).toLowerCase() as keyof typeof IMAGE_QUALITY

      let transformer = sharp(inputBuffer)

      if (extension === 'jpg' || extension === 'jpeg') {
        transformer = transformer.jpeg({ quality: IMAGE_QUALITY[extension] })
      } else if (extension === 'png') {
        transformer = transformer.png({ quality: IMAGE_QUALITY.png })
      } else if (extension === 'webp') {
        transformer = transformer.webp({ quality: IMAGE_QUALITY.webp })
      } else if (extension === 'avif') {
        transformer = transformer.avif({ quality: IMAGE_QUALITY.avif })
      } else {
        return
      }

      const optimizedBuffer = await transformer.toBuffer()

      if (optimizedBuffer.length >= inputBuffer.length) {
        return
      }

      await writeFile(imagePath, optimizedBuffer)

      optimizedCount += 1
      totalSavedBytes += inputBuffer.length - optimizedBuffer.length
    })
  )

  return { optimizedCount, totalSavedBytes }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/styles/index.scss'],
  app: {
    head: {
      meta: [
        { name: 'theme-color', content: '#fff' },
        { name: 'msapplication-TileColor', content: '#fff' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.svg' }
      ]
    }
  },
  components: [
    {
      path: '~/components'
    },
    {
      path: '~/page-modules'
    }
  ],
  nitro: {
    hooks: {
      compiled: async (nitro: Nitro) => {
        if (process.env.NODE_ENV !== 'production') {
          return
        }

        const publicDir = nitro.options.output.publicDir
        const publicDirStats = await stat(publicDir).catch(() => null)

        if (!publicDirStats?.isDirectory()) {
          return
        }

        const { optimizedCount, totalSavedBytes } = await compressBuiltImages(publicDir)

        if (optimizedCount > 0) {
          nitro.logger.success(
            `Compressed ${optimizedCount} image(s), saved ${(totalSavedBytes / 1024).toFixed(1)} kB in ${publicDir}`
          )
        }
      }
    }
  }
})
