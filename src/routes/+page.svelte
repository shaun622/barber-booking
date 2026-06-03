<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const t = $derived(
    data.lang === 'id'
      ? {
          title: 'Pesan Janji',
          sub: 'Pilih kategori layanan untuk mulai.',
          pkg: 'Paket',
          pkgDesc: 'Tarif diskon untuk tampilan terbaik',
          onsite: 'Layanan di Tempat',
          onsiteDesc: 'Potong rambut, cukur, dan styling di barbershop kami',
          oncall: 'Panggilan ke Rumah',
          oncallDesc: 'Barber profesional datang ke tempat Anda',
          group: 'Booking untuk 2+ orang? WhatsApp kami'
        }
      : {
          title: 'Book an Appointment',
          sub: 'Choose a service category to begin.',
          pkg: 'Packages',
          pkgDesc: 'Discounted rates to keep you looking your best',
          onsite: 'On-Site Services',
          onsiteDesc: 'Premium grooming at our Sanur shop',
          oncall: 'On-Call Services',
          oncallDesc: 'Professional grooming at your location',
          group: 'Booking for 2+ people? WhatsApp us'
        }
  );
</script>

<h1 class="text-2xl font-semibold tracking-tight">{t.title}</h1>
<p class="text-neutral-600 mt-1">{t.sub}</p>

<nav class="mt-6 grid gap-3">
  <a
    href="/service?cat=package"
    class="block rounded-xl border border-neutral-200 bg-white p-5 hover:border-neutral-900 transition">
    <div class="font-medium">{t.pkg}</div>
    <div class="text-sm text-neutral-500 mt-0.5">{t.pkgDesc}</div>
  </a>
  <a
    href="/service?cat=onsite"
    class="block rounded-xl border border-neutral-200 bg-white p-5 hover:border-neutral-900 transition">
    <div class="font-medium">{t.onsite}</div>
    <div class="text-sm text-neutral-500 mt-0.5">{t.onsiteDesc}</div>
  </a>
  <a
    href="/service?cat=oncall"
    class="block rounded-xl border border-neutral-200 bg-white p-5 hover:border-neutral-900 transition">
    <div class="font-medium">{t.oncall}</div>
    <div class="text-sm text-neutral-500 mt-0.5">{t.oncallDesc}</div>
  </a>
</nav>

<a
  href="https://wa.me/6281337995251?text={encodeURIComponent(
    data.lang === 'id'
      ? 'Halo, saya ingin booking untuk lebih dari 1 orang.'
      : 'Hi, I’d like to book for more than one person.'
  )}"
  class="mt-6 block text-center text-sm text-neutral-600 underline">
  {t.group}
</a>
