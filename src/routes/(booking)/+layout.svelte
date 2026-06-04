<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import StepIndicator from '$lib/components/StepIndicator.svelte';
  import { serviceName } from '$lib/i18n';
  import {
    booking,
    ui,
    seedBooking,
    totalPrice,
    totalDuration,
    hasFromPrice,
    idr
  } from '$lib/booking.svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: any } = $props();

  // Reseed authoritative selection state on every navigation.
  $effect(() => {
    seedBooking({
      base: data.summary.base,
      addons: data.summary.addons,
      barberId: data.summary.barberId,
      barberName: data.summary.barberName,
      startsAt: data.summary.startsAt,
      lang: data.lang
    });
  });

  const path = $derived(page.url.pathname);
  const currentStep = $derived(
    path.startsWith('/details')
      ? 4
      : path.startsWith('/time')
        ? 3
        : path.startsWith('/barber')
          ? 2
          : 1
  );

  const t = $derived(
    data.lang === 'id'
      ? {
          none: 'Belum ada layanan',
          total: 'Total',
          from: 'mulai',
          min: 'menit',
          any: 'Barber mana saja',
          withW: 'dengan',
          continue: 'Lanjut'
        }
      : {
          none: 'No services selected',
          total: 'Total',
          from: 'from',
          min: 'min',
          any: 'Any professional',
          withW: 'with',
          continue: 'Continue'
        }
  );

  function goBack() {
    if (history.length > 1) history.back();
    else goto('/');
  }

  const months = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  };
  const days = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    id: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  };
  function fmtWhen(iso: string, lang: 'en' | 'id') {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
    if (!m) return iso;
    const [, y, mo, d, h, mi] = m;
    const dow = new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay();
    return `${days[lang][dow]} ${+d} ${months[lang][+mo - 1]} · ${h}:${mi}`;
  }

  const barberLabel = $derived(
    booking.barberId === undefined ? '' : booking.barberName ? booking.barberName : t.any
  );
</script>

<div class="mx-auto max-w-6xl px-5 sm:px-6 py-6 sm:py-8">
  <div class="flex items-center gap-4 mb-7 sm:mb-9">
    <button class="btn-icon shrink-0" onclick={goBack} aria-label="Back">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
    </button>
    <StepIndicator current={currentStep} lang={data.lang} />
  </div>

  <div class="grid lg:grid-cols-[1fr_21rem] gap-6 lg:gap-10 items-start">
    <!-- Step content -->
    <div class="min-w-0 pb-32 lg:pb-0">
      {@render children()}
    </div>

    <!-- Summary (desktop) -->
    <aside class="hidden lg:block sticky top-24">
      <div class="glass-strong p-6">
        <span class="brand-logo h-11 w-11" aria-label="Balis Barber"></span>
        <p class="text-xs text-[var(--color-bone-faint)] mt-2">Sanur Kauh, Denpasar · Bali</p>

        <hr class="hairline my-5" />

        {#if !booking.base}
          <p class="text-sm text-[var(--color-bone-dim)] py-6 text-center">{t.none}</p>
        {:else}
          <div class="space-y-4">
            <div class="flex justify-between gap-3">
              <div class="min-w-0">
                <div class="font-medium leading-snug">{serviceName(booking.base, data.lang)}</div>
                <div class="text-xs text-[var(--color-bone-dim)] mt-0.5 tnum">
                  {totalDuration()} {t.min}{#if barberLabel} · {t.withW} {barberLabel}{/if}
                </div>
                {#if booking.startsAt}
                  <div class="text-xs brass-text mt-1 tnum">{fmtWhen(booking.startsAt, data.lang)}</div>
                {/if}
              </div>
              <div class="text-sm tnum whitespace-nowrap">{idr(booking.base.price_idr)}</div>
            </div>

            {#each booking.addons as a (a.id)}
              <div class="flex justify-between gap-3 text-sm">
                <div class="text-[var(--color-bone-dim)] min-w-0">
                  + {serviceName(a, data.lang)}
                </div>
                <div class="tnum whitespace-nowrap text-[var(--color-bone-dim)]">{idr(a.price_idr)}</div>
              </div>
            {/each}
          </div>

          <hr class="hairline my-5" />

          <div class="flex items-baseline justify-between">
            <span class="text-sm text-[var(--color-bone-dim)]">{t.total}</span>
            <span class="display text-xl tnum">
              {#if hasFromPrice()}<span class="text-sm text-[var(--color-bone-dim)] mr-1">{t.from}</span>{/if}{idr(totalPrice())}
            </span>
          </div>
        {/if}

        <button
          class="btn btn-brass w-full mt-6"
          disabled={!ui.action || ui.action.disabled}
          onclick={() => ui.action?.run()}>
          {ui.action?.label ?? t.continue}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </aside>
  </div>
</div>

<!-- Summary (mobile sticky bar) -->
<div class="surface-dark lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[rgba(28,24,20,0.95)] backdrop-blur-xl px-5 py-3 rounded-t-2xl">
  <div class="flex items-center gap-4">
    <div class="min-w-0 flex-1">
      {#if booking.base}
        <div class="text-xs text-[var(--color-bone-dim)] truncate">
          {serviceName(booking.base, data.lang)}{#if barberLabel} · {barberLabel}{/if}
        </div>
        <div class="display text-lg tnum leading-tight">
          {#if hasFromPrice()}<span class="text-xs text-[var(--color-bone-dim)] mr-1">{t.from}</span>{/if}{idr(totalPrice())}
        </div>
      {:else}
        <div class="text-sm text-[var(--color-bone-dim)]">{t.none}</div>
      {/if}
    </div>
    <button
      class="btn btn-brass shrink-0"
      disabled={!ui.action || ui.action.disabled}
      onclick={() => ui.action?.run()}>
      {ui.action?.label ?? t.continue}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  </div>
</div>
