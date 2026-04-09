<script setup lang="ts">
import { Confirm, Selections, Upload } from './sections';

</script>

<template>
  <section class="hero">
    <div class="container">
      <div class="hero__content">
        <Selections />
        <Upload/>
        <Confirm />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
  @use './style.scss';
</style>
