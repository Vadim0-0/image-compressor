<script setup lang="ts">
import i18n from './i18n.json'

const { archiveName, canDownload, filesCount, isProcessing, imageCount, downloadArchive } = useCompressor()
const locale = useLocale()
const metaText = computed(() =>
  i18n.meta[locale.value]
    .replace('{archiveName}', archiveName.value)
    .replace('{filesCount}', String(filesCount.value))
    .replace('{imageCount}', String(imageCount.value))
)
</script>

<template>
  <div class="confirm">
    <button class="confirm__btn" type="button" :disabled="!canDownload" @click="downloadArchive">
      {{ isProcessing ? i18n.buildingArchiveButton[locale] : i18n.downloadButton[locale] }}
    </button>
    <p v-if="filesCount" class="confirm__meta">
      {{ metaText }}
    </p>
  </div>
</template>

<style scoped lang="scss">
  @use './confirm.scss';
</style>
