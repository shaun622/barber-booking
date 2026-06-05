<script lang="ts">
  import ReassignBarber from '$lib/components/ReassignBarber.svelte';
  import RescheduleTime from '$lib/components/RescheduleTime.svelte';
  import type { PageData } from './$types';
  import type { BookingRow } from './+page.server';
  let { data }: { data: PageData } = $props();

  function fmt(iso: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
    return m ? `${m[3]}/${m[2]} ${m[4]}:${m[5]}` : iso;
  }
  function idr(n: number) {
    return 'IDR ' + n.toLocaleString('id-ID');
  }
  function waLink(b: BookingRow) {
    const phone = String(b.whatsapp_phone).replace(/[^0-9]/g, '');
    const lang = b.language ?? 'en';
    const text =
      lang === 'id'
        ? `Halo ${b.customer_name}, konfirmasi booking di Balis Barber: ${fmt(b.starts_at)}. Terima kasih!`
        : `Hi ${b.customer_name}, confirming your Balis Barber booking on ${fmt(b.starts_at)}. See you then!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  function statusClass(s: string) {
    if (s === 'pending') return 'bg-amber-500/15 text-amber-700';
    if (s === 'confirmed') return 'bg-sky-600/15 text-sky-700';
    if (s === 'completed') return 'bg-emerald-600/15 text-emerald-700';
    if (s === 'no_show') return 'bg-rose-500/15 text-rose-700';
    return 'bg-black/5 text-[var(--color-bone-dim)]';
  }
</script>

<div class="mx-auto max-w-4xl px-5 sm:px-6 py-8">
  <div class="flex flex-wrap items-center justify-between gap-4 mb-7">
    <h1 class="display text-3xl">Bookings</h1>
    <div class="flex gap-2 text-sm">
      <a href="?view=today" class="pill {data.view === 'today' ? 'pill-active' : ''}">Today</a>
      <a href="?view=week" class="pill {data.view === 'week' ? 'pill-active' : ''}">Next 7 days</a>
      <a href="/admin/blocks" class="pill">Block time</a>
    </div>
  </div>

  {#if data.bookings.length === 0}
    <div class="glass p-10 text-center text-[var(--color-bone-dim)]">No bookings.</div>
  {:else}
    <div class="grid gap-3">
      {#each data.bookings as b (b.id)}
        <div class="glass p-5">
          <div class="flex flex-wrap items-start gap-3 justify-between">
            <div class="min-w-0">
              <div class="font-medium">
                {b.customer_name}
                <span class="text-[var(--color-bone-dim)] tnum font-normal">· {b.whatsapp_phone}</span>
              </div>
              {#if b.email}<div class="text-sm text-[var(--color-bone-dim)]">{b.email}</div>{/if}
              <div class="text-sm text-[var(--color-bone-faint)] mt-0.5 tnum">
                #{b.id} · {fmt(b.starts_at)} · {b.duration_min_total} min · {idr(b.price_idr_total)}
              </div>
              <div class="text-sm text-[var(--color-bone-dim)] mt-1">
                {b.service_name} · {b.barber_name ?? 'Any'}
                {#if b.address}<br /><span class="text-[var(--color-bone-faint)]">→ {b.address}</span>{/if}
              </div>
            </div>
            <span class="rounded-full px-2.5 py-1 text-xs {statusClass(b.status)}">{b.status}</span>
          </div>

          <div class="mt-4 flex flex-wrap gap-2 text-sm">
            <ReassignBarber id={b.id} barberId={b.barber_id} barbers={data.barbers} />
            <RescheduleTime id={b.id} startsAt={b.starts_at} />
            <a href={waLink(b)} target="_blank" rel="noopener" class="btn btn-brass !py-1.5 !px-3 !text-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.7-1.7c-.2-.5-.4-.4-.6-.4h-.4a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c2.1.8 2.1.5 2.5.5a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.2c-.1-.2-.3-.2-.5-.3z" /></svg>
              WhatsApp
            </a>
            <form method="POST" action="?/setStatus">
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="status" value="confirmed" />
              <button class="pill">Confirm</button>
            </form>
            <form method="POST" action="?/setStatus">
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="status" value="completed" />
              <button class="pill">Completed</button>
            </form>
            <form method="POST" action="?/setStatus">
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="status" value="no_show" />
              <button class="pill">No-show</button>
            </form>
            <form method="POST" action="?/setStatus">
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="status" value="cancelled" />
              <button class="pill !text-red-600">Cancel</button>
            </form>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
