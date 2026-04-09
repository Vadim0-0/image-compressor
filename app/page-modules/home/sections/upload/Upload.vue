<script setup lang="ts">
import i18n from './i18n.json'

const {
  filesCount,
  isDragging,
  errorMessage,
  setDragging,
  selectFiles,
  clearEntries,
  handleDrop
} = useCompressor()

const locale = useLocale()
const filesInputRef = ref<HTMLInputElement | null>(null)
const folderInputRef = ref<HTMLInputElement | null>(null)

const hasEntries = computed(() => filesCount.value > 0)
const selectedFilesInfo = computed(() =>
  i18n.selectedFilesInfo[locale.value].replace('{count}', String(filesCount.value))
)

const openFilesPicker = () => {
  filesInputRef.value?.click()
}

const openFolderPicker = () => {
  folderInputRef.value?.click()
}

const onInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  selectFiles(target.files)
  target.value = ''
}

const onDragLeave = () => {
  setDragging(false)
}
</script>

<template>
  <div
    class="upload"
    :class="{ 'upload--dragging': isDragging,
      'upload--error': errorMessage
    }"
    @dragenter.prevent="setDragging(true)"
    @dragover.prevent="setDragging(true)"
    @dragleave.prevent="onDragLeave"
    @drop="handleDrop"
  >
    <input
      ref="filesInputRef"
      class="upload__input"
      type="file"
      multiple
      @change="onInputChange"
    >
    <input
      ref="folderInputRef"
      class="upload__input"
      type="file"
      multiple
      webkitdirectory
      directory
      @change="onInputChange"
    >
    <div v-if="!errorMessage" class="upload__content">
      <div class="upload__content-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
          <path fill="" d="M11 16V7.85l-2.6 2.6L7 9l5-5l5 5l-1.4 1.45l-2.6-2.6V16zm-5 4q-.825 0-1.412-.587T4 18v-3h2v3h12v-3h2v3q0 .825-.587 1.413T18 20z"/>
        </svg>
      </div>
      <div class="upload__content-descr">
        <p>
          {{ i18n.dropzoneTitle[locale] }}
        </p>
      </div>
      <div v-if="hasEntries" class="upload__content-info">
        <p>
          {{ selectedFilesInfo }}
        </p>
      </div>
      <div class="upload__content-actions">
        <button class="upload__content-actions__btn choice-files" type="button" @click="openFilesPicker">
          {{ i18n.chooseFilesButton[locale] }}
        </button>
        <button class="upload__content-actions__btn choice-folder" type="button" @click="openFolderPicker">
          {{ i18n.chooseFolderButton[locale] }}
        </button>
        <button v-if="hasEntries" class="upload__content-actions__btn clean" type="button" @click="clearEntries">
          {{ i18n.clearButton[locale] }}
        </button>
      </div>
    </div>
    <p v-else class="upload__message-error">
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped lang="scss">
  @use './upload.scss';
</style>
