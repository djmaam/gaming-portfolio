import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '../menuCursor';

function buildDOM() {
  document.body.innerHTML = `
    <ul id="start-menu-list">
      <li class="menu-row"><a href="#">GitHub</a></li>
      <li class="menu-row"><a href="#">LinkedIn</a></li>
    </ul>
  `;
}

describe('menuCursor', () => {
  it('returns no-op cleanup when #start-menu-list missing', () => {
    const cleanup = mount();
    expect(() => cleanup()).not.toThrow();
  });

  it('mount returns a function', () => {
    buildDOM();
    const cleanup = mount();
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('focusin on .menu-row child adds menu-row--selected to that row', () => {
    buildDOM();
    mount();
    const rows = document.querySelectorAll('.menu-row');
    const link = rows[0].querySelector('a')!;
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(rows[0].classList.contains('menu-row--selected')).toBe(true);
    expect(rows[1].classList.contains('menu-row--selected')).toBe(false);
  });

  it('focusin switches selection away from previous row', () => {
    buildDOM();
    mount();
    const rows = document.querySelectorAll('.menu-row');
    rows[0].querySelector('a')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    rows[1].querySelector('a')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(rows[0].classList.contains('menu-row--selected')).toBe(false);
    expect(rows[1].classList.contains('menu-row--selected')).toBe(true);
  });

  it('Z key clicks the anchor inside selected row when focus is inside the list', () => {
    buildDOM();
    mount();
    const rows = document.querySelectorAll('.menu-row');
    rows[0].classList.add('menu-row--selected');
    const link = rows[0].querySelector('a')!;
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {});
    // Simulate focus inside the list
    Object.defineProperty(document, 'activeElement', { value: link, configurable: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('Z key is no-op when focused element is outside the list', () => {
    buildDOM();
    mount();
    const rows = document.querySelectorAll('.menu-row');
    rows[0].classList.add('menu-row--selected');
    const link = rows[0].querySelector('a')!;
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {});
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    Object.defineProperty(document, 'activeElement', { value: outside, configurable: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('Z key is no-op when an INPUT is focused inside the list', () => {
    buildDOM();
    mount();
    const list = document.getElementById('start-menu-list')!;
    const input = document.createElement('input');
    list.appendChild(input);
    const rows = document.querySelectorAll('.menu-row');
    rows[0].classList.add('menu-row--selected');
    const link = rows[0].querySelector('a')!;
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {});
    Object.defineProperty(document, 'activeElement', { value: input, configurable: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('cleanup removes the keydown listener', () => {
    buildDOM();
    const cleanup = mount();
    const rows = document.querySelectorAll('.menu-row');
    rows[0].classList.add('menu-row--selected');
    const link = rows[0].querySelector('a')!;
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {});
    Object.defineProperty(document, 'activeElement', { value: link, configurable: true });
    cleanup();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('cleanup removes the focusin listener', () => {
    buildDOM();
    const cleanup = mount();
    cleanup();
    const rows = document.querySelectorAll('.menu-row');
    rows[0].querySelector('a')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(rows[0].classList.contains('menu-row--selected')).toBe(false);
  });
});
