<script lang="ts">
  import { page } from '$app/state';
  let { children }: { children: any } = $props();

  const isLogin = $derived(page.url.pathname === '/admin/login');
  const path = $derived(page.url.pathname);

  const items = [
    { href: '/admin', label: 'Bookings', exact: true },
    { href: '/admin/calendar', label: 'Calendar', exact: false },
    { href: '/admin/services', label: 'Services', exact: false },
    { href: '/admin/barbers', label: 'Barbers', exact: false },
    { href: '/admin/blocks', label: 'Block time', exact: false }
  ];
  function active(href: string, exact: boolean) {
    return exact ? path === href : path.startsWith(href);
  }
</script>

{#if isLogin}
  {@render children()}
{:else}
  <div class="border-b border-[var(--color-line)] bg-[rgba(244,239,229,0.7)] backdrop-blur-lg sticky top-16 z-30">
    <div class="mx-auto max-w-5xl px-5 sm:px-6 flex items-center gap-1 overflow-x-auto h-12">
      {#each items as it (it.href)}
        <a
          href={it.href}
          class="px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition {active(it.href, it.exact)
            ? 'bg-[var(--gold-500)] text-[var(--ink-heading)] font-medium'
            : 'text-[var(--color-bone-dim)] hover:text-[var(--color-bone)]'}">
          {it.label}
        </a>
      {/each}
      <form method="POST" action="/admin/logout" class="ml-auto">
        <button class="px-3 py-1.5 text-sm text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] whitespace-nowrap">Sign out</button>
      </form>
    </div>
  </div>

  {@render children()}
{/if}
