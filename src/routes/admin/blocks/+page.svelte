<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  function fmt(iso: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
    return m ? `${m[3]}/${m[2]} ${m[4]}:${m[5]}` : iso;
  }
</script>

<a href="/admin" class="text-sm text-neutral-500 underline">← Back</a>
<h1 class="text-xl font-semibold mt-2 mb-4">Block time</h1>

<form method="POST" action="?/create" class="grid gap-3 max-w-md bg-white p-4 rounded-xl border">
  <label class="block">
    <span class="text-sm">Barber</span>
    <select name="barber_id" class="mt-1 block w-full rounded-lg border px-3 py-2">
      <option value="">All barbers</option>
      {#each data.barbers as b}<option value={b.id}>{b.name}</option>{/each}
    </select>
  </label>
  <label class="block">
    <span class="text-sm">Date</span>
    <input
      name="date"
      type="date"
      required
      class="mt-1 block w-full rounded-lg border px-3 py-2" />
  </label>
  <div class="grid grid-cols-2 gap-3">
    <label class="block">
      <span class="text-sm">From</span>
      <input
        name="start"
        type="time"
        required
        class="mt-1 block w-full rounded-lg border px-3 py-2" />
    </label>
    <label class="block">
      <span class="text-sm">To</span>
      <input
        name="end"
        type="time"
        required
        class="mt-1 block w-full rounded-lg border px-3 py-2" />
    </label>
  </div>
  <label class="block">
    <span class="text-sm">Reason</span>
    <input name="reason" class="mt-1 block w-full rounded-lg border px-3 py-2" />
  </label>
  <button class="rounded-lg bg-neutral-900 text-white py-2">Add block</button>
</form>

<h2 class="text-sm font-semibold uppercase tracking-wide text-neutral-500 mt-8 mb-2">
  Upcoming blocks
</h2>
{#if data.blocks.length === 0}
  <p class="text-neutral-500 text-sm">None.</p>
{:else}
  <ul class="grid gap-2">
    {#each data.blocks as bl (bl.id)}
      <li class="flex items-center justify-between bg-white rounded-lg border px-3 py-2 text-sm">
        <div>
          {bl.barber_name ?? 'All'} · {fmt(bl.starts_at)} → {fmt(bl.ends_at)}
          {#if bl.reason}· <span class="text-neutral-500">{bl.reason}</span>{/if}
        </div>
        <form method="POST" action="?/delete">
          <input type="hidden" name="id" value={bl.id} />
          <button class="text-red-600 underline">Remove</button>
        </form>
      </li>
    {/each}
  </ul>
{/if}
