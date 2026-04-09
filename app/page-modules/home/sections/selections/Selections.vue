<script setup lang="ts">
import { QUALITY_OPTIONS } from '~/composables/useCompressor'
import i18n from './i18n.json'

const { quality, setQuality } = useCompressor()
const locale = useLocale()
</script>

<template>
  <div class="selections">
    <div class="selections__content">
      <div class="selections__content-descr">
        <p>
          {{ i18n.title[locale] }}
        </p>
        <span>
          {{ i18n.hintCompression[locale] }}
        </span>
        <span>
          {{ i18n.hintOtherFiles[locale] }}
        </span>
      </div>
      <div class="selections__content-choice">
        <button
          v-for="value in QUALITY_OPTIONS"
          :key="value"
          class="selections__content-choice__btn"
          :class="{ active: value === quality }"
          type="button"
          @click="setQuality(value)"
        >
          {{ value }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @use './selections.scss';
</style>
