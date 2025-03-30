<script lang="ts">
  import { locale, _ } from 'svelte-i18n';
  import { browser } from '$app/environment';

  const languageCodes = ['en', 'de', 'it', 'fr', 'es'];

  let isOpen = false;

  function switchLanguage(langCode: string) {
    locale.set(langCode);
    isOpen = false;
  }

  // Close dropdown when clicking outside
  if (browser) {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-switcher')) {
        isOpen = false;
      }
    });
  }
</script>

<div class="language-switcher relative">
  <button
    class="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
    on:click={() => isOpen = !isOpen}
    aria-label={$_('language_switcher.select_language')}
  >
    {$_('language_switcher.languages.' + $locale)}
    <svg
      class="h-4 w-4 transition-transform {isOpen ? 'rotate-180' : ''}"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clip-rule="evenodd"
      />
    </svg>
  </button>

  {#if isOpen}
    <div
      class="absolute right-0 mt-1 w-40 rounded-md border border-neutral-300 bg-white py-1 shadow-lg dark:border-neutral-600 dark:bg-neutral-800"
      role="menu"
      aria-label={$_('language_switcher.select_language')}
    >
      {#each languageCodes as langCode}
        <button
          class="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700 {$locale === langCode ? 'text-accent' : ''}"
          on:click={() => switchLanguage(langCode)}
          role="menuitem"
          aria-current={$locale === langCode ? 'true' : 'false'}
        >
          {$_('language_switcher.languages.' + langCode)}
        </button>
      {/each}
    </div>
  {/if}
</div> 