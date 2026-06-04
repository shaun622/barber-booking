<script lang="ts">
  import type { PageData } from './$types';
  import MapCard from '$lib/components/MapCard.svelte';
  let { data }: { data: PageData } = $props();

  const t = $derived(
    data.lang === 'id'
      ? {
          eyebrow: 'Sanur · Bali',
          title: 'Tampil tajam,',
          titleEm: 'tanpa antre.',
          sub: 'Pesan kursi Anda di Balis Barber. Pilih layanan, barber, dan waktu — kami konfirmasi lewat WhatsApp.',
          choose: 'Pilih kategori',
          pkg: 'Paket',
          pkgDesc: 'Tarif hemat untuk tampilan terbaik Anda.',
          onsite: 'Layanan di Tempat',
          onsiteDesc: 'Potong, cukur, dan styling di barbershop kami.',
          oncall: 'Panggilan ke Rumah',
          oncallDesc: 'Barber profesional datang ke lokasi Anda.',
          from: 'mulai',
          group: 'Booking untuk 2+ orang? WhatsApp kami',
          groupMsg: 'Halo, saya ingin booking untuk lebih dari 1 orang.'
        }
      : {
          eyebrow: 'Sanur · Bali',
          title: 'Look sharp,',
          titleEm: 'skip the queue.',
          sub: 'Reserve your chair at Balis Barber. Choose a service, your barber, and a time — we confirm by WhatsApp.',
          choose: 'Choose a category',
          pkg: 'Packages',
          pkgDesc: 'Discounted rates to keep you looking your best.',
          onsite: 'On-Site Services',
          onsiteDesc: 'Cuts, shaves and styling at our Sanur shop.',
          oncall: 'On-Call Service',
          oncallDesc: 'A professional barber comes to your location.',
          from: 'from',
          group: 'Booking for 2+ people? WhatsApp us',
          groupMsg: 'Hi, I’d like to book for more than one person.'
        }
  );

  const cats = $derived([
    { key: 'package', name: t.pkg, desc: t.pkgDesc, price: data.fromPrice.package },
    { key: 'onsite', name: t.onsite, desc: t.onsiteDesc, price: data.fromPrice.onsite },
    { key: 'oncall', name: t.oncall, desc: t.oncallDesc, price: data.fromPrice.oncall }
  ]);

  function idr(n: number) {
    return 'IDR ' + n.toLocaleString('id-ID');
  }
</script>

<div class="mx-auto max-w-6xl px-5 sm:px-6">
  <!-- Hero -->
  <section class="pt-14 sm:pt-20 pb-10">
    <p class="eyebrow rise rise-1">{t.eyebrow}</p>
    <h1 class="display text-[2.7rem] sm:text-6xl mt-4 rise rise-2">
      {t.title}<br /><span class="brass-text">{t.titleEm}</span>
    </h1>
    <p class="mt-5 max-w-xl text-[var(--color-bone-dim)] text-base sm:text-lg leading-relaxed rise rise-3">
      {t.sub}
    </p>
  </section>

  <!-- Category cards -->
  <p class="eyebrow mb-4 rise rise-3">{t.choose}</p>
  <div class="grid gap-4 sm:grid-cols-3 pb-4">
    {#each cats as c, i (c.key)}
      <a
        href="/service?cat={c.key}"
        class="group glass card-i p-6 flex flex-col min-h-[12rem] rise rise-{i + 3}">
        <div class="flex-1">
          <h2 class="display text-2xl">{c.name}</h2>
          <p class="mt-2 text-sm text-[var(--color-bone-dim)] leading-relaxed">{c.desc}</p>
        </div>
        <div class="mt-6 flex items-center justify-between">
          <span class="text-sm text-[var(--color-bone-faint)] tnum">
            {t.from} <span class="text-[var(--color-bone)]">{idr(c.price)}</span>
          </span>
          <span
            class="btn-icon group-hover:!border-[rgba(201,169,97,0.5)]"
            aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </a>
    {/each}
  </div>

  <!-- Location -->
  <section class="pt-6 pb-2">
    <div class="max-w-3xl">
      <MapCard lang={data.lang} />
    </div>
  </section>

  <!-- Group CTA -->
  <div class="py-8">
    <a
      href="https://wa.me/6281337995251?text={encodeURIComponent(t.groupMsg)}"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-2 text-sm text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] transition">
      <span class="h-px w-8 bg-[var(--color-line-strong)]"></span>
      {t.group}
    </a>
  </div>
</div>
