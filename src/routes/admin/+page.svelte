<script lang="ts">
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
</script>

<div class="flex items-center justify-between mb-4">
  <h1 class="text-xl font-semibold">Bookings</h1>
  <div class="flex gap-2 text-sm">
    <a
      href="?view=today"
      class:font-semibold={data.view === 'today'}
      class="px-3 py-1 rounded border border-neutral-300">Today</a>
    <a
      href="?view=week"
      class:font-semibold={data.view === 'week'}
      class="px-3 py-1 rounded border border-neutral-300">Next 7 days</a>
    <a href="/admin/blocks" class="px-3 py-1 rounded border border-neutral-300">Block time</a>
  </div>
</div>

{#if data.bookings.length === 0}
  <p class="text-neutral-500">No bookings.</p>
{:else}
  <div class="grid gap-3">
    {#each data.bookings as b (b.id)}
      <div class="rounded-xl border border-neutral-200 bg-white p-4">
        <div class="flex flex-wrap items-baseline gap-2 justify-between">
          <div>
            <div class="font-medium">{b.customer_name} · {b.whatsapp_phone}</div>
            <div class="text-sm text-neutral-500">
              #{b.id} · {fmt(b.starts_at)} · {b.duration_min_total} min · {idr(b.price_idr_total)}
            </div>
            <div class="text-sm">
              {b.service_name} · {b.barber_name ?? 'Any'}
              {#if b.address}<br /><span class="text-neutral-500">→ {b.address}</span>{/if}
            </div>
          </div>
          <div class="text-sm">
            <span
              class="rounded-full px-2 py-0.5 text-xs"
              class:bg-yellow-100={b.status === 'pending'}
              class:bg-green-100={b.status === 'confirmed' || b.status === 'completed'}
              class:bg-neutral-200={b.status === 'cancelled' || b.status === 'no_show'}
              >{b.status}</span>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap gap-2 text-sm">
          <a
            href={waLink(b)}
            target="_blank"
            rel="noopener"
            class="px-3 py-1 rounded bg-green-600 text-white">WhatsApp</a>
          <form method="POST" action="?/setStatus">
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="status" value="confirmed" />
            <button class="px-3 py-1 rounded border border-neutral-300">Confirm</button>
          </form>
          <form method="POST" action="?/setStatus">
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="status" value="completed" />
            <button class="px-3 py-1 rounded border border-neutral-300">Completed</button>
          </form>
          <form method="POST" action="?/setStatus">
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="status" value="no_show" />
            <button class="px-3 py-1 rounded border border-neutral-300">No-show</button>
          </form>
          <form method="POST" action="?/setStatus">
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="status" value="cancelled" />
            <button class="px-3 py-1 rounded border border-neutral-300 text-red-600">Cancel</button>
          </form>
        </div>
      </div>
    {/each}
  </div>
{/if}
