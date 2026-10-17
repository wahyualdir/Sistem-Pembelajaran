'use server';

import * as notifActions from '@/modules/notifications/actions';

export async function getNotifikasiAction(...args: Parameters<typeof notifActions.getNotifikasiAction>) {
  return notifActions.getNotifikasiAction(...args);
}

export async function tandaiDibacaAction(...args: Parameters<typeof notifActions.tandaiDibacaAction>) {
  return notifActions.tandaiDibacaAction(...args);
}

export async function tandaiSemuaDibacaAction(...args: Parameters<typeof notifActions.tandaiSemuaDibacaAction>) {
  return notifActions.tandaiSemuaDibacaAction(...args);
}

export async function tundaNotifikasiAction(...args: Parameters<typeof notifActions.tundaNotifikasiAction>) {
  return notifActions.tundaNotifikasiAction(...args);
}

export async function getPreferensiAction(...args: Parameters<typeof notifActions.getPreferensiAction>) {
  return notifActions.getPreferensiAction(...args);
}

export async function simpanPreferensiAction(...args: Parameters<typeof notifActions.simpanPreferensiAction>) {
  return notifActions.simpanPreferensiAction(...args);
}
