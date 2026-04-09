<script setup lang="ts">
const locale = useLocale()

useHead({
  htmlAttrs: {
    lang: locale
  }
})
</script>
 
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
