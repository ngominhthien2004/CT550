<script setup>
import { PremiumBenefits, PremiumCompare, PremiumCreatorTools, PremiumFinalCta, PremiumHero, PremiumTopBar } from '@/components/premium'
import { compareRows, premiumFeatures, premiumMoments, premiumPerks } from '../constants/premium'
</script>

<template>
  <div class="premium-page">
    <PremiumTopBar />

    <main>
      <PremiumHero :moments="premiumMoments" />
      <PremiumBenefits :features="premiumFeatures" />
      <PremiumCompare :perks="premiumPerks" :rows="compareRows" />
      <PremiumCreatorTools />
      <PremiumFinalCta />
    </main>
  </div>
</template>

<style scoped>
.premium-page {
  min-height: 100vh;
  color: #f8f5ef;
  background:
    radial-gradient(circle at top left, rgba(245, 174, 45, 0.28), transparent 28%),
    radial-gradient(circle at 80% 18%, rgba(52, 152, 219, 0.2), transparent 26%),
    linear-gradient(180deg, #120f17 0%, #18141e 38%, #f6efe6 38.1%, #f6efe6 100%);
}
</style>
