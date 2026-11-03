import { describe, expect, it } from 'vitest';
import { canApplyUpdate } from '../src/pwaUpdates';

const idle = {
  updateAvailable: true,
  route: 'learn',
  dialogOpen: false,
  pendingStart: false,
  mobileOpen: false,
  updating: false,
  updateError: false,
};

describe('automatic PWA update safety', () => {
  it('applies a waiting update without asking on an idle page or after a saved exit', () => {
    expect(canApplyUpdate(idle)).toBe(true);
    expect(canApplyUpdate({ ...idle, route: 'result' })).toBe(true);
  });
  it('never reloads during a lesson, dialog, menu or unsaved choice', () => {
    expect(canApplyUpdate({ ...idle, route: 'lesson' })).toBe(false);
    expect(canApplyUpdate({ ...idle, dialogOpen: true })).toBe(false);
    expect(canApplyUpdate({ ...idle, pendingStart: true })).toBe(false);
    expect(canApplyUpdate({ ...idle, mobileOpen: true })).toBe(false);
    expect(canApplyUpdate({ ...idle, updateAvailable: false })).toBe(false);
    expect(canApplyUpdate({ ...idle, updating: true })).toBe(false);
    expect(canApplyUpdate({ ...idle, updateError: true })).toBe(false);
  });
});
