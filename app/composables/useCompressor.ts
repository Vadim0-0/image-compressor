import JSZip from 'jszip'
import { computed, readonly, ref, shallowRef } from 'vue'
import uploadI18n from '~/page-modules/home/sections/upload/i18n.json'
import confirmI18n from '~/page-modules/home/sections/confirm/i18n.json'
import type { AppLocale } from '~/composables/useLocale'

type CompressorEntry = {
  file: File
  relativePath: string
  isCompressibleImage: boolean
}

type BrowserFileSystemEntry = {
  isFile: boolean
  isDirectory: boolean
  name: string
}

type BrowserFileEntry = BrowserFileSystemEntry & {
  file: (callback: (file: File) => void, errorCallback?: (error: DOMException) => void) => void
}

type BrowserDirectoryEntry = BrowserFileSystemEntry & {
  createReader: () => {
    readEntries: (
      callback: (entries: BrowserFileSystemEntry[]) => void,
      errorCallback?: (error: DOMException) => void
    ) => void
  }
}

type DataTransferItemWithEntry = DataTransferItem & {
  webkitGetAsEntry?: () => BrowserFileSystemEntry | null
}

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

export const QUALITY_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const

const entries = shallowRef<CompressorEntry[]>([])
const quality = ref<(typeof QUALITY_OPTIONS)[number]>(80)
const isDragging = ref(false)
const isProcessing = ref(false)
const errorMessage = ref('')

const normalizeRelativePath = (path: string) => path.replace(/\\/g, '/').replace(/^\/+/, '')
const formatLocaleMessage = (message: string, params: Record<string, string> = {}) =>
  Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    message
  )

const detectMimeType = (file: File) => {
  if (file.type) {
    return file.type.toLowerCase()
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension) {
    return ''
  }

  if (extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg'
  }

  if (extension === 'png') {
    return 'image/png'
  }

  if (extension === 'webp') {
    return 'image/webp'
  }

  return ''
}

const isCompressibleImage = (file: File) => {
  const mimeType = detectMimeType(file)
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  return IMAGE_MIME_TYPES.has(mimeType) || IMAGE_EXTENSIONS.has(extension)
}

const createEntry = (file: File, relativePath?: string): CompressorEntry => ({
  file,
  relativePath: normalizeRelativePath(relativePath || file.webkitRelativePath || file.name),
  isCompressibleImage: isCompressibleImage(file)
})

const sortEntries = (value: CompressorEntry[]) =>
  [...value].sort((left, right) => left.relativePath.localeCompare(right.relativePath))

const setEntries = (value: CompressorEntry[]) => {
  entries.value = sortEntries(
    Array.from(
      new Map(value.map((entry) => [entry.relativePath, entry])).values()
    )
  )
  errorMessage.value = ''
}

const setQuality = (value: number) => {
  if (QUALITY_OPTIONS.includes(value as (typeof QUALITY_OPTIONS)[number])) {
    quality.value = value as (typeof QUALITY_OPTIONS)[number]
  }
}

const clearEntries = () => {
  entries.value = []
  errorMessage.value = ''
}

const createEntriesFromFileList = (fileList: FileList | null) => {
  if (!fileList) {
    return []
  }

  return Array.from(fileList).map((file) => createEntry(file))
}

const readFileEntry = (entry: BrowserFileEntry, relativePath: string) =>
  new Promise<CompressorEntry>((resolve, reject) => {
    entry.file(
      (file) => resolve(createEntry(file, relativePath)),
      (error) => reject(error)
    )
  })

const readDirectoryEntries = async (directory: BrowserDirectoryEntry) => {
  const directoryReader = directory.createReader()
  const nestedEntries: BrowserFileSystemEntry[] = []

  while (true) {
    const batch = await new Promise<BrowserFileSystemEntry[]>((resolve, reject) => {
      directoryReader.readEntries(resolve, reject)
    })

    if (batch.length === 0) {
      return nestedEntries
    }

    nestedEntries.push(...batch)
  }
}

const flattenFileSystemEntry = async (
  entry: BrowserFileSystemEntry,
  currentPath = ''
): Promise<CompressorEntry[]> => {
  const entryPath = normalizeRelativePath(currentPath ? `${currentPath}/${entry.name}` : entry.name)

  if (entry.isFile) {
    return [await readFileEntry(entry as BrowserFileEntry, entryPath)]
  }

  if (entry.isDirectory) {
    const nestedEntries = await readDirectoryEntries(entry as BrowserDirectoryEntry)
    const files = await Promise.all(
      nestedEntries.map((nestedEntry) => flattenFileSystemEntry(nestedEntry, entryPath))
    )

    return files.flat()
  }

  return []
}

const readDroppedEntries = async (items: DataTransferItemList) => {
  const flattenedEntries = await Promise.all(
    Array.from(items).map(async (item) => {
      const fileSystemEntry = (item as DataTransferItemWithEntry).webkitGetAsEntry?.()

      if (fileSystemEntry) {
        return flattenFileSystemEntry(fileSystemEntry)
      }

      const file = item.getAsFile()
      return file ? [createEntry(file)] : []
    })
  )

  return flattenedEntries.flat()
}

const loadImageToCanvas = async (file: File, locale: AppLocale) => {
  if (!process.client) {
    throw new Error(confirmI18n.browserOnlyError[locale])
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error(confirmI18n.canvasError[locale])
  }

  if ('createImageBitmap' in window) {
    const imageBitmap = await createImageBitmap(file)

    canvas.width = imageBitmap.width
    canvas.height = imageBitmap.height
    context.drawImage(imageBitmap, 0, 0)
    imageBitmap.close()

    return canvas
  }

  const imageUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error(
        formatLocaleMessage(confirmI18n.imageReadError[locale], { fileName: file.name })
      ))
      element.src = imageUrl
    })

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    context.drawImage(image, 0, 0)

    return canvas
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, value: number) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, value)
  })

const quantizeChannel = (value: number, levels: number) => {
  if (levels <= 1) {
    return 0
  }

  const step = 255 / (levels - 1)
  return Math.max(0, Math.min(255, Math.round(Math.round(value / step) * step)))
}

const getPngOptimisationLevel = (selectedQuality: number) => {
  const normalizedQuality = Math.min(100, Math.max(10, selectedQuality))
  return Math.min(6, Math.max(1, Math.round((100 - normalizedQuality) / 18) + 1))
}

const getPngQuantizationLevels = (selectedQuality: number) => {
  const normalizedQuality = Math.min(100, Math.max(10, selectedQuality))
  const qualityFactor = (normalizedQuality - 10) / 90

  return {
    colorLevels: Math.max(8, Math.round(8 + qualityFactor * 248)),
    alphaLevels: Math.max(16, Math.round(16 + qualityFactor * 240))
  }
}

const applyPngQuantization = (canvas: HTMLCanvasElement, selectedQuality: number) => {
  if (selectedQuality >= 100) {
    return
  }

  const context = canvas.getContext('2d')
  if (!context) {
    return
  }

  const { colorLevels, alphaLevels } = getPngQuantizationLevels(selectedQuality)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData

  for (let index = 0; index < data.length; index += 4) {
    data[index] = quantizeChannel(data[index]!, colorLevels)
    data[index + 1] = quantizeChannel(data[index + 1]!, colorLevels)
    data[index + 2] = quantizeChannel(data[index + 2]!, colorLevels)
    data[index + 3] = quantizeChannel(data[index + 3]!, alphaLevels)
  }

  context.putImageData(imageData, 0, 0)
}

const optimisePngBlob = async (blob: Blob, selectedQuality: number) => {
  const { optimise } = await import('@jsquash/oxipng')
  const optimizedBuffer = await optimise(await blob.arrayBuffer(), {
    level: getPngOptimisationLevel(selectedQuality),
    optimiseAlpha: true
  })

  if (optimizedBuffer.byteLength >= blob.size) {
    return blob
  }

  return new Blob([optimizedBuffer], { type: 'image/png' })
}

const compressPngImage = async (file: File, selectedQuality: number, locale: AppLocale) => {
  if (selectedQuality >= 100) {
    const optimizedOriginalBlob = await optimisePngBlob(file, selectedQuality)
    return optimizedOriginalBlob.size < file.size ? optimizedOriginalBlob : file
  }

  const canvas = await loadImageToCanvas(file, locale)
  applyPngQuantization(canvas, selectedQuality)

  const quantizedBlob = await canvasToBlob(canvas, 'image/png', 1)
  if (!quantizedBlob) {
    return file
  }

  const optimizedBlob = await optimisePngBlob(quantizedBlob, selectedQuality)
  if (optimizedBlob.size >= file.size) {
    return file
  }

  return optimizedBlob
}

const compressImage = async (file: File, selectedQuality: number, locale: AppLocale) => {
  const mimeType = detectMimeType(file)

  if (!IMAGE_MIME_TYPES.has(mimeType)) {
    return file
  }

  if (mimeType === 'image/png') {
    return compressPngImage(file, selectedQuality, locale)
  }

  const canvas = await loadImageToCanvas(file, locale)
  const compressedBlob = await canvasToBlob(canvas, mimeType, selectedQuality / 100)

  if (!compressedBlob || compressedBlob.size >= file.size) {
    return file
  }

  return compressedBlob
}

const downloadBlob = (blob: Blob, filename: string) => {
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = downloadUrl
  link.download = filename
  link.click()

  URL.revokeObjectURL(downloadUrl)
}

const getArchiveBaseName = (value: CompressorEntry[]) => {
  if (value.length === 0) {
    return 'compressed-files'
  }

  const topLevelPaths = Array.from(
    new Set(
      value
        .map((entry) => entry.relativePath.split('/')[0])
        .filter(Boolean)
    )
  )

  if (topLevelPaths.length === 1) {
    return `${topLevelPaths[0]}`
  }

  return 'compressed-files'
}

export const useCompressor = () => {
  const locale = useLocale()
  const filesCount = computed(() => entries.value.length)
  const imageCount = computed(() => entries.value.filter((entry) => entry.isCompressibleImage).length)
  const archiveName = computed(() => `${getArchiveBaseName(entries.value)}.zip`)
  const canDownload = computed(() => filesCount.value > 0 && !isProcessing.value)

  const selectFiles = (fileList: FileList | null) => {
    const nextEntries = createEntriesFromFileList(fileList)

    if (nextEntries.length === 0) {
      errorMessage.value = uploadI18n.selectionError[locale.value]
      return
    }

    setEntries(nextEntries)
  }

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault()
    isDragging.value = false

    try {
      const droppedEntries = event.dataTransfer?.items?.length
        ? await readDroppedEntries(event.dataTransfer.items)
        : createEntriesFromFileList(event.dataTransfer?.files ?? null)

      if (droppedEntries.length === 0) {
        errorMessage.value = uploadI18n.readDropError[locale.value]
        return
      }

      setEntries(droppedEntries)
    } catch (error) {
      errorMessage.value = error instanceof Error
        ? error.message
        : uploadI18n.readFolderError[locale.value]
    }
  }

  const downloadArchive = async () => {
    if (!canDownload.value) {
      return
    }

    isProcessing.value = true
    errorMessage.value = ''

    try {
      const zip = new JSZip()
      const processedFiles = await Promise.all(
        entries.value.map(async (entry) => ({
          relativePath: entry.relativePath,
          blob: entry.isCompressibleImage
            ? await compressImage(entry.file, quality.value, locale.value)
            : entry.file
        }))
      )

      processedFiles.forEach((file) => {
        zip.file(file.relativePath, file.blob)
      })

      const archiveBlob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(archiveBlob, archiveName.value)
    } catch (error) {
      errorMessage.value = error instanceof Error
        ? error.message
        : confirmI18n.archiveError[locale.value]
    } finally {
      isProcessing.value = false
    }
  }

  return {
    quality: readonly(quality),
    entries: readonly(entries),
    filesCount,
    imageCount,
    archiveName,
    isDragging: readonly(isDragging),
    isProcessing: readonly(isProcessing),
    errorMessage: readonly(errorMessage),
    canDownload,
    setQuality,
    setDragging: (value: boolean) => {
      isDragging.value = value
    },
    selectFiles,
    clearEntries,
    handleDrop,
    downloadArchive
  }
}
