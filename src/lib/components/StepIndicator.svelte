<script lang="ts">
  let { current, lang }: { current: number; lang: 'en' | 'id' } = $props();

  const labels = $derived(
    lang === 'id'
      ? ['Layanan', 'Barber', 'Waktu', 'Data']
      : ['Service', 'Barber', 'Time', 'Details']
  );
</script>

<nav class="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1" aria-label="Progress">
  {#each labels as label, i (i)}
    {@const n = i + 1}
    {@const state = n < current ? 'done' : n === current ? 'current' : 'todo'}
    <div class="flex items-center gap-2 sm:gap-3 shrink-0">
      <div class="flex items-center gap-2">
        <span
          class="display text-sm tnum w-6 transition-colors"
          class:brass-text={state === 'current'}
          style:color={state === 'done'
            ? 'var(--color-bone-dim)'
            : state === 'todo'
              ? 'var(--color-bone-faint)'
              : undefined}>
          0{n}
        </span>
        <span
          class="text-sm transition-colors"
          style:color={state === 'current'
            ? 'var(--color-bone)'
            : state === 'done'
              ? 'var(--color-bone-dim)'
              : 'var(--color-bone-faint)'}>
          {label}
        </span>
      </div>
      {#if i < labels.length - 1}
        <span
          class="h-px w-5 sm:w-8 transition-colors"
          style:background={n < current ? 'var(--color-brass-deep)' : 'var(--color-line-strong)'}
        ></span>
      {/if}
    </div>
  {/each}
</nav>
