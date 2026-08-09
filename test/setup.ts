import { beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  history.replaceState({}, '', '/');
});
