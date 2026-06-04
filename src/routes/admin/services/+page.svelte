<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();

  const cats = [
    { v: 'package', l: 'Package' },
    { v: 'onsite', l: 'On-Site' },
    { v: 'addon', l: 'Add-On' },
    { v: 'oncall', l: 'On-Call' }
  ];
</script>

<div class="mx-auto max-w-4xl px-5 sm:px-6 py-8">
  <div class="flex items-center justify-between gap-3 mb-2">
    <h1 class="display text-3xl">Services</h1>
    <span class="text-sm text-[var(--color-bone-dim)]">{data.services.length} total</span>
  </div>
  <p class="text-sm text-[var(--color-bone-dim)] mb-6">
    Edit names, prices, durations and flags. Inactive services are hidden from the booking page.
  </p>

  {#if form && 'created' in form}
    <div class="mb-4 text-sm text-emerald-800 bg-emerald-600/10 border border-emerald-600/20 rounded-lg px-3 py-2">Service added.</div>
  {:else if form && 'deactivated' in form}
    <div class="mb-4 text-sm text-amber-800 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">In use by bookings — deactivated instead of deleted.</div>
  {/if}

  <!-- Add new -->
  <details class="glass p-5 mb-6">
    <summary class="cursor-pointer font-medium">+ Add a service</summary>
    <form method="POST" action="?/create" class="grid sm:grid-cols-2 gap-3 mt-4">
      <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Name (EN)</span><input name="name_en" required class="field mt-1" /></label>
      <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Name (ID)</span><input name="name_id" class="field mt-1" /></label>
      <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Category</span>
        <select name="category" class="field mt-1">{#each cats as c}<option value={c.v}>{c.l}</option>{/each}</select>
      </label>
      <div class="grid grid-cols-2 gap-3">
        <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Price (IDR)</span><input name="price_idr" type="number" min="0" step="1000" value="100000" class="field mt-1 tnum" /></label>
        <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Duration (min)</span><input name="duration_min" type="number" min="5" step="5" value="30" class="field mt-1 tnum" /></label>
      </div>
      <div class="sm:col-span-2 flex flex-wrap gap-4 items-center text-sm">
        <label class="inline-flex items-center gap-2"><input type="checkbox" name="male_only" /> Male only</label>
        <label class="inline-flex items-center gap-2"><input type="checkbox" name="price_from_only" /> "From" price</label>
        <label class="inline-flex items-center gap-2"><input type="checkbox" name="requires_address" /> Needs address</label>
        <button class="btn btn-brass !py-2 !px-4 !text-sm ml-auto">Add service</button>
      </div>
    </form>
  </details>

  <!-- Existing -->
  <div class="grid gap-3">
    {#each data.services as s (s.id)}
      <div class="glass p-4 {s.active ? '' : 'opacity-60'}">
        <form method="POST" action="?/update" class="grid sm:grid-cols-2 gap-3">
          <input type="hidden" name="id" value={s.id} />
          <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Name (EN)</span><input name="name_en" value={s.name_en} class="field mt-1" /></label>
          <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Name (ID)</span><input name="name_id" value={s.name_id} class="field mt-1" /></label>
          <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Category</span>
            <select name="category" class="field mt-1">{#each cats as c}<option value={c.v} selected={s.category === c.v}>{c.l}</option>{/each}</select>
          </label>
          <div class="grid grid-cols-3 gap-2">
            <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Price</span><input name="price_idr" type="number" min="0" step="1000" value={s.price_idr} class="field mt-1 tnum" /></label>
            <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Min</span><input name="duration_min" type="number" min="5" step="5" value={s.duration_min} class="field mt-1 tnum" /></label>
            <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Sort</span><input name="sort_order" type="number" value={s.sort_order} class="field mt-1 tnum" /></label>
          </div>
          <label class="block sm:col-span-1"><span class="text-xs text-[var(--color-bone-dim)]">Includes (EN)</span><input name="description_en" value={s.description_en ?? ''} class="field mt-1" /></label>
          <div class="grid grid-cols-2 gap-2">
            <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Travel buffer (min)</span><input name="travel_buffer_min" type="number" min="0" step="5" value={s.travel_buffer_min} class="field mt-1 tnum" /></label>
            <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Includes (ID)</span><input name="description_id" value={s.description_id ?? ''} class="field mt-1" /></label>
          </div>
          <div class="sm:col-span-2 flex flex-wrap items-center gap-4 text-sm pt-1">
            <label class="inline-flex items-center gap-2"><input type="checkbox" name="male_only" checked={s.male_only === 1} /> Male only</label>
            <label class="inline-flex items-center gap-2"><input type="checkbox" name="price_from_only" checked={s.price_from_only === 1} /> "From"</label>
            <label class="inline-flex items-center gap-2"><input type="checkbox" name="requires_address" checked={s.requires_address === 1} /> Address</label>
            <label class="inline-flex items-center gap-2"><input type="checkbox" name="active" checked={s.active === 1} /> Active</label>
            <button class="btn btn-brass !py-1.5 !px-4 !text-sm ml-auto">Save</button>
          </div>
        </form>
        <form method="POST" action="?/remove" class="mt-2 text-right">
          <input type="hidden" name="id" value={s.id} />
          <button class="text-xs text-red-600 hover:text-red-700">Delete</button>
        </form>
      </div>
    {/each}
  </div>
</div>
