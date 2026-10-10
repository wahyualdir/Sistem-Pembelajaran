import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithRoles, listUserDevicesAction } from '@/modules/identity/actions';
import { DeviceManager } from './device-manager';

export default async function DevicesPage() {
  const userContext = await getCurrentUserWithRoles();

  if (!userContext) {
    redirect('/login');
  }

  const { devices } = await listUserDevicesAction();

  return (
    <div className="p-6 sm:p-9 w-full">
      <DeviceManager devices={devices || []} userId={userContext.user.id} />
    </div>
  );
}
