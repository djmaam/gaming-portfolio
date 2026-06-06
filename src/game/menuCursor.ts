export function mount(): () => void {
  const list = document.getElementById('start-menu-list');
  if (!list) return () => {};

  const rows = Array.from(list.querySelectorAll<HTMLElement>('.menu-row'));

  // Syncs with StartMenu.astro's select() which calls .focus() after each ArrowKey move
  const onFocusin = (e: FocusEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.menu-row');
    if (!row) return;
    rows.forEach(r => r.classList.remove('menu-row--selected'));
    row.classList.add('menu-row--selected');
  };
  list.addEventListener('focusin', onFocusin);

  // Z = game-select key; Enter/Space already work natively on focused <a>/<button>
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'z' && e.key !== 'Z') return;
    const target = document.activeElement as HTMLElement;
    if (!list.contains(target)) return;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    list.querySelector<HTMLElement>('.menu-row--selected a, .menu-row--selected button')?.click();
  };
  window.addEventListener('keydown', onKey);

  return () => {
    list.removeEventListener('focusin', onFocusin);
    window.removeEventListener('keydown', onKey);
  };
}
