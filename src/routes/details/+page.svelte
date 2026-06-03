<script lang="ts">
  import { goto } from '$app/navigation';
  import { dict, serviceName } from '$lib/i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData & { lang: 'en' | 'id' } } = $props();
  const t = $derived(dict(data.lang));

  let name = $state('');
  let phone = $state('+62');
  let address = $state('');
  let turnstileToken = $state('');
  let submitting = $state(false);
  let errorMsg = $state<string | null>(null);

  const requiresAddress = $derived(data.base.requires_address === 1);

  function whenLabel(iso: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
    return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : iso;
  }

  function fmt(n: number) {
    return 'IDR ' + n.toLocaleString('id-ID');
  }

  $effect(() => {
    if (!data.turnstileSiteKey) return;
    if (document.querySelector('script[data-turnstile]')) return;
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    s.dataset.turnstile = '1';
    document.head.appendChild(s);
  });

  (globalThis as any).turnstileCb = (tok: string) => (turnstileToken = tok);

  async function submit(e: Event) {
    e.preventDefault();
    errorMsg = null;
    if (!name.trim()) return (errorMsg = t.errors.missing_name);
    if (!/^\+?\d{8,15}$/.test(phone.replace(/\s/g, '')))
      return (errorMsg = t.errors.missing_phone);
    if (requiresAddress && !address.trim()) return (errorMsg = t.errors.missing_address);

    submitting = true;
    try {
      const r = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          whatsapp_phone: phone.replace(/\s/g, ''),
          address: requiresAddress ? address.trim() : null,
          turnstileToken
        })
      });
      if (r.status === 429) {
        errorMsg = t.errors.rate_limit;
        return;
      }
      if (r.status === 409) {
        errorMsg = t.errors.slot_taken;
        return;
      }
      if (!r.ok) {
        const j: any = await r.json().catch(() => ({}));
        errorMsg = j.error === 'turnstile' ? t.errors.turnstile : t.errors.generic;
        return;
      }
      const j: any = await r.json();
      goto(`/confirm?ref=${j.id}`);
    } finally {
      submitting = false;
    }
  }
</script>

<nav class="text-sm text-neutral-500 mb-3">
  <a href="/time" class="hover:underline">{t.steps.time}</a>
  <span class="mx-1">›</span>
  <span class="text-neutral-900 font-medium">{t.steps.details}</span>
</nav>

<h1 class="text-2xl font-semibold tracking-tight mb-1">{t.steps.details}</h1>
<div class="text-sm text-neutral-500 mb-4">
  {serviceName(data.base, data.lang)} · {whenLabel(data.startsAt)} · {data.total.duration_min} {t.common.min} · {fmt(data.total.price_idr)}
</div>

<form onsubmit={submit} class="grid gap-4">
  <label class="block">
    <span class="text-sm font-medium">{t.details.name}</span>
    <input
      bind:value={name}
      required
      class="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2" />
  </label>

  <label class="block">
    <span class="text-sm font-medium">{t.details.phone}</span>
    <input
      bind:value={phone}
      type="tel"
      inputmode="tel"
      required
      class="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2"
      placeholder="+62…" />
    <span class="text-xs text-neutral-500">{t.details.phone_hint}</span>
  </label>

  {#if requiresAddress}
    <label class="block">
      <span class="text-sm font-medium">{t.details.address}</span>
      <textarea
        bind:value={address}
        rows="3"
        required
        class="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2"></textarea>
      <span class="text-xs text-neutral-500">{t.details.address_hint}</span>
    </label>
  {/if}

  {#if data.turnstileSiteKey}
    <div
      class="cf-turnstile"
      data-sitekey={data.turnstileSiteKey}
      data-callback="turnstileCb"></div>
  {/if}

  {#if errorMsg}
    <div class="text-sm text-red-600">{errorMsg}</div>
  {/if}

  <button
    type="submit"
    disabled={submitting}
    class="rounded-lg bg-neutral-900 text-white py-3 font-medium disabled:opacity-60">
    {submitting ? t.details.submitting : t.details.submit}
  </button>

  <p class="text-xs text-neutral-500">{t.details.consent}</p>
</form>
