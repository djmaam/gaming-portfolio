let cleanupFn: (() => void) | null = null;

export function mount(): void {
  if (cleanupFn) return;

  const list = document.getElementById('start-menu-list');
  if (!list) return;

  const rows = Array.from(list.querySelectorAll<HTMLElement>('.menu-row'));

  // Keep .menu-row--selected in sync when Tab focus moves into the menu
  const onFocusin = (e: FocusEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.menu-row');
    if (!row) return;
    rows.forEach(r => r.classList.remove('menu-row--selected'));
    row.classList.add('menu-row--selected');
  };
  list.addEventListener('focusin', onFocusin);

  // Z = game-select key; activates the currently highlighted menu row
  // Enter/Space already work natively on focused <a>/<button> — only Z needs handling
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'z' && e.key !== 'Z') return;
    if (!list.contains(document.activeElement)) return;
    const target = document.activeElement as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    const active = list.querySelector<HTMLElement>('.menu-row--selected a, .menu-row--selected button');
    active?.click();
  };
  window.addEventListener('keydown', onKey);

  cleanupFn = () => {
    list.removeEventListener('focusin', onFocusin);
    window.removeEventListener('keydown', onKey);
    cleanupFn = null;
  };
}

export function unmount(): void {
  cleanupFn?.();
}
