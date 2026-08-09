export function focusTrap(node: HTMLElement): { destroy: () => void } {
  const previous = document.activeElement as HTMLElement | null;
  const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusables = (): HTMLElement[] => Array.from(node.querySelectorAll<HTMLElement>(selector)).filter((item) => !item.hidden && item.offsetParent !== null);
  queueMicrotask(() => (node.querySelector<HTMLElement>('[autofocus]') ?? focusables()[0] ?? node).focus());
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return; const items = focusables(); if (!items.length) return;
    const first = items[0] as HTMLElement; const last = items[items.length - 1] as HTMLElement;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  node.addEventListener('keydown', keydown);
  return { destroy: () => { node.removeEventListener('keydown', keydown); previous?.focus(); } };
}
