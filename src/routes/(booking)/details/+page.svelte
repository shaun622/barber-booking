<script lang="ts">
  import { goto } from '$app/navigation';
  import { booking, ui } from '$lib/booking.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData & { lang: 'en' | 'id' } } = $props();

  const t = $derived(
    data.lang === 'id'
      ? {
          title: 'Data Anda',
          name: 'Nama Anda',
          phone: 'Nomor WhatsApp',
          phoneHint: 'Kami akan WhatsApp untuk konfirmasi booking Anda.',
          address: 'Alamat',
          addressHint: 'Ke mana barber harus datang?',
          consent: 'Dengan mengirim, Anda setuju dihubungi via WhatsApp.',
          submit: 'Kirim booking',
          submitting: 'Mengirim…',
          emailLabel: 'Email',
          optional: '(opsional)',
          eEmail: 'Masukkan email yang valid, atau kosongkan.',
          eName: 'Mohon masukkan nama Anda.',
          ePhone: 'Mohon masukkan nomor WhatsApp yang valid.',
          eAddr: 'Alamat wajib untuk panggilan ke rumah.',
          eSlot: 'Slot baru saja terisi. Pilih waktu lain.',
          eTurn: 'Mohon selesaikan cek anti-spam.',
          eRate: 'Terlalu banyak permintaan. Tunggu sebentar.',
          eGen: 'Terjadi kesalahan. Coba lagi.'
        }
      : {
          title: 'Your details',
          name: 'Your name',
          phone: 'WhatsApp number',
          phoneHint: 'We’ll WhatsApp you to confirm your booking.',
          address: 'Address',
          addressHint: 'Where should the barber come?',
          consent: 'By submitting you agree to be contacted on WhatsApp.',
          submit: 'Request booking',
          submitting: 'Submitting…',
          emailLabel: 'Email',
          optional: '(optional)',
          eEmail: 'Please enter a valid email, or leave it blank.',
          eName: 'Please enter your name.',
          ePhone: 'Please enter a valid WhatsApp number.',
          eAddr: 'Address is required for on-call bookings.',
          eSlot: 'That time was just taken. Please pick another.',
          eTurn: 'Please complete the spam check.',
          eRate: 'Too many requests. Please wait a minute.',
          eGen: 'Something went wrong. Please try again.'
        }
  );

  let name = $state('');
  let phone = $state('+62');
  let email = $state('');
  let address = $state('');
  let turnstileToken = $state('');
  let submitting = $state(false);
  let errorMsg = $state<string | null>(null);

  const requiresAddress = $derived(data.base.requires_address === 1);

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

  async function submit(e?: Event) {
    e?.preventDefault();
    errorMsg = null;
    if (!name.trim()) return (errorMsg = t.eName);
    if (!/^\+?\d{8,15}$/.test(phone.replace(/\s/g, ''))) return (errorMsg = t.ePhone);
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return (errorMsg = t.eEmail);
    if (requiresAddress && !address.trim()) return (errorMsg = t.eAddr);

    submitting = true;
    try {
      const r = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          whatsapp_phone: phone.replace(/\s/g, ''),
          email: email.trim() || null,
          address: requiresAddress ? address.trim() : null,
          turnstileToken
        })
      });
      if (r.status === 429) return (errorMsg = t.eRate);
      if (r.status === 409) return (errorMsg = t.eSlot);
      if (!r.ok) {
        const j: any = await r.json().catch(() => ({}));
        return (errorMsg = j.error === 'turnstile' ? t.eTurn : t.eGen);
      }
      const j: any = await r.json();
      goto(`/confirm?ref=${j.id}`);
    } finally {
      submitting = false;
    }
  }

  $effect(() => {
    ui.action = {
      label: submitting ? t.submitting : t.submit,
      disabled: submitting,
      run: submit
    };
    return () => {
      ui.action = null;
    };
  });
</script>

<h1 class="display text-3xl sm:text-4xl rise rise-1 mb-6">{t.title}</h1>

<form onsubmit={submit} class="grid gap-5 max-w-lg rise rise-2">
  <label class="block">
    <span class="text-sm font-medium text-[var(--color-bone-dim)]">{t.name}</span>
    <input bind:value={name} required autocomplete="name" class="field mt-1.5" />
  </label>

  <label class="block">
    <span class="text-sm font-medium text-[var(--color-bone-dim)]">{t.phone}</span>
    <input bind:value={phone} type="tel" inputmode="tel" required autocomplete="tel" placeholder="+62…" class="field mt-1.5 tnum" />
    <span class="text-xs text-[var(--color-bone-faint)] mt-1.5 block">{t.phoneHint}</span>
  </label>

  <label class="block">
    <span class="text-sm font-medium text-[var(--color-bone-dim)]">
      {t.emailLabel} <span class="text-[var(--color-bone-faint)] font-normal">{t.optional}</span>
    </span>
    <input bind:value={email} type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" class="field mt-1.5" />
  </label>

  {#if requiresAddress}
    <label class="block">
      <span class="text-sm font-medium text-[var(--color-bone-dim)]">{t.address}</span>
      <textarea bind:value={address} rows="3" required class="field mt-1.5 resize-none"></textarea>
      <span class="text-xs text-[var(--color-bone-faint)] mt-1.5 block">{t.addressHint}</span>
    </label>
  {/if}

  {#if data.turnstileSiteKey}
    <div class="cf-turnstile" data-sitekey={data.turnstileSiteKey} data-callback="turnstileCb" data-theme="dark"></div>
  {/if}

  {#if errorMsg}
    <div class="text-sm text-red-600 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{errorMsg}</div>
  {/if}

  <p class="text-xs text-[var(--color-bone-faint)]">{t.consent}</p>
</form>
