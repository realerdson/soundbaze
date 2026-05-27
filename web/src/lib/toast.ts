/**
 * Global toast notification store.
 *
 * Usage (from any Svelte component or server action):
 *   import { toast } from '$lib/toast'
 *   toast.success('Annotation live. ɛyɛ!')
 *   toast.error('Something went wrong.')
 *   toast.info('Sign in to upvote.')
 */

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id:      string;
  kind:    ToastKind;
  message: string;
}

function createToastStore() {
  let items = $state<Toast[]>([]);

  function add(kind: ToastKind, message: string, duration = 4000) {
    const id = crypto.randomUUID();
    items = [...items, { id, kind, message }];
    setTimeout(() => remove(id), duration);
  }

  function remove(id: string) {
    items = items.filter(t => t.id !== id);
  }

  return {
    get items() { return items; },
    success: (msg: string, ms?: number) => add('success', msg, ms),
    error:   (msg: string, ms?: number) => add('error',   msg, ms ?? 6000),
    info:    (msg: string, ms?: number) => add('info',    msg, ms),
    remove,
  };
}

export const toast = createToastStore();
