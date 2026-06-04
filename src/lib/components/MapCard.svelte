<script lang="ts">
  let { lang = 'en', height = 'h-60' }: { lang?: 'en' | 'id'; height?: string } = $props();

  const t = $derived(
    lang === 'id'
      ? { visit: 'Lokasi', hours: 'Buka setiap hari · 09.00–19.00', directions: 'Petunjuk arah', open: 'Buka di Maps' }
      : { visit: 'Visit us', hours: 'Open daily · 09:00–19:00', directions: 'Get directions', open: 'Open in Maps' }
  );

  const address = 'Jl. Bypass Ngurah Rai No.50xx, Sanur, Denpasar Selatan, Bali 80227';
  const embed =
    'https://www.google.com/maps?q=' +
    encodeURIComponent('Balis Barber, Jl. Bypass Ngurah Rai, Sanur, Bali') +
    '&z=16&output=embed';
  const directions = 'https://www.google.com/maps/dir/?api=1&destination=-8.7040087,115.2539749';
  const mapsLink = 'https://maps.app.goo.gl/Kdy9Vk3hqxp3Jmmr8';
</script>

<div class="glass overflow-hidden">
  <iframe
    title="Balis Barber — location map"
    src={embed}
    class="w-full {height} block"
    style="border:0"
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"
    allowfullscreen></iframe>
  <div class="p-5">
    <p class="eyebrow">{t.visit}</p>
    <p class="mt-2 text-sm text-[var(--color-bone)] leading-relaxed">{address}</p>
    <p class="mt-1 text-xs text-[var(--color-bone-dim)]">{t.hours}</p>
    <div class="mt-4 flex flex-wrap gap-2">
      <a href={directions} target="_blank" rel="noopener" class="btn btn-brass !py-2 !px-4 !text-sm">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
        {t.directions}
      </a>
      <a href={mapsLink} target="_blank" rel="noopener" class="btn btn-ghost !py-2 !px-4 !text-sm">{t.open}</a>
    </div>
  </div>
</div>
