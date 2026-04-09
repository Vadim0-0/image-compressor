<script setup lang="ts">
import i18n from './i18n.json'

const locale = useLocale()
</script>

<template>
  <header class="header">
    <div class="container">
      <div class="header__content">
        <div class="header__content-title">
          <p>
            {{ i18n.title[locale] }}
          </p>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
  @use './appHeader.scss';
</style>
