<script lang="ts">
  import { page } from '$app/state';
  import { booking, ui, seedBooking } from '$lib/booking.svelte';
  import MapCard from '$lib/components/MapCard.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  const t = $derived(
    data.lang === 'id'
      ? {
          eyebrow: 'Terkirim',
          title: 'Permintaan diterima',
          body: 'Kami akan menghubungi Anda via WhatsApp sebentar lagi untuk mengonfirmasi booking.',
          ref: 'Referensi',
          wa: 'Chat WhatsApp kami',
          home: 'Kembali ke awal'
        }
      : {
          eyebrow: 'Confirmed',
          title: 'Request received',
          body: 'We’ll message you on WhatsApp shortly to confirm your booking.',
          ref: 'Reference',
          wa: 'Message us on WhatsApp',
          home: 'Back to start'
        }
  );

  const ref = $derived(page.url.searchParams.get('ref') ?? '');

  // Clear selection state so a new booking starts fresh.
  $effect(() => {
    seedBooking({ base: null, addons: [], barberId: undefined, barberName: null, startsAt: undefined });
    ui.action = null;
  });
</script>

<div class="mx-auto max-w-lg px-5 sm:px-6 py-16 sm:py-24 text-center">
  <div class="relative inline-grid place-items-center mb-8 rise rise-1">
    <div class="absolute w-28 h-28 rounded-full blur-2xl" style="background: radial-gradient(circle, rgba(201,169,97,0.4), transparent 70%);"></div>
    <div class="relative w-20 h-20 rounded-full grid place-items-center bg-gradient-to-br from-[var(--color-brass-light)] to-[var(--color-brass)] text-[#1a1408]">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    </div>
  </div>

  <p class="eyebrow rise rise-2">{t.eyebrow}</p>
  <h1 class="display text-4xl mt-3 rise rise-2">{t.title}</h1>
  <p class="mt-4 text-[var(--color-bone-dim)] leading-relaxed rise rise-3">{t.body}</p>

  {#if ref}
    <div class="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full glass text-sm rise rise-3">
      <span class="text-[var(--color-bone-faint)]">{t.ref}</span>
      <span class="display brass-text tnum">#{ref}</span>
    </div>
  {/if}

  <div class="mt-10 flex flex-col items-center gap-4 rise rise-4">
    <a href="https://wa.me/6281337995251" target="_blank" rel="noopener" class="btn btn-ghost">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.7-1.7c-.2-.5-.4-.4-.6-.4h-.4a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c2.1.8 2.1.5 2.5.5a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.2c-.1-.2-.3-.2-.5-.3z" /></svg>
      {t.wa}
    </a>
    <a href="/" class="text-sm text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] transition">{t.home}</a>
  </div>

  <div class="mt-12 text-left rise rise-4">
    <MapCard lang={data.lang} height="h-52" />
  </div>
</div>
