'use client';

import {
  IPackage,
  IRegisterPackagePayload,
  IDeliverPackagePayload,
  IQuickAlertPayload,
  IQuickAlert,
  IFetchPackagesResponse,
  IFetchAlertsResponse,
  PackageStatus,
} from '@/app/dashboard/packages/packages.types';

// ==================== Packages ====================

export const fetchPackages = async ({
  token,
  complexId,
  options = {},
}: {
  token: string;
  complexId: string;
  options?: {
    status?: PackageStatus;
    limit?: number;
    cursor?: string;
  };
}): Promise<IFetchPackagesResponse> => {
  if (!token) throw new Error('Token is required');
  if (!complexId) throw new Error('ComplexId is required');

  const params = new URLSearchParams({
    complexId,
    status: options.status || 'PENDING_PICKUP',
    limit: String(options.limit || 10),
  });

  if (options.cursor) {
    params.append('cursor', options.cursor);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/getPackagesList?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error fetching packages');
  }

  return response.json();
};

export const registerPackage = async ({
  token,
  complexId,
  payload,
}: {
  token: string;
  complexId: string;
  payload: IRegisterPackagePayload;
}): Promise<{ success: boolean; package: IPackage }> => {
  if (!token) throw new Error('Token is required');
  if (!complexId) throw new Error('ComplexId is required');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/managePackages?complexId=${complexId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'REGISTER_PACKAGE',
        payload,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error registering package');
  }

  return response.json();
};

export const deliverPackage = async ({
  token,
  complexId,
  payload,
}: {
  token: string;
  complexId: string;
  payload: IDeliverPackagePayload;
}): Promise<{ success: boolean; package: IPackage }> => {
  if (!token) throw new Error('Token is required');
  if (!complexId) throw new Error('ComplexId is required');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/managePackages?complexId=${complexId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'DELIVER_PACKAGE',
        payload,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error delivering package');
  }

  return response.json();
};

// ==================== Quick Alerts ====================

export const createQuickAlert = async ({
  token,
  complexId,
  payload,
}: {
  token: string;
  complexId: string;
  payload: IQuickAlertPayload;
}): Promise<{ success: boolean; alert: IQuickAlert }> => {
  if (!token) throw new Error('Token is required');
  if (!complexId) throw new Error('ComplexId is required');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/quickAlert?complexId=${complexId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error creating alert');
  }

  return response.json();
};

export const fetchAlerts = async ({
  token,
  complexId,
  options = {},
}: {
  token: string;
  complexId: string;
  options?: {
    limit?: number;
    cursor?: string;
  };
}): Promise<IFetchAlertsResponse> => {
  if (!token) throw new Error('Token is required');
  if (!complexId) throw new Error('ComplexId is required');

  const params = new URLSearchParams({
    complexId,
    limit: String(options.limit || 10),
  });

  if (options.cursor) {
    params.append('cursor', options.cursor);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/getAlertsList?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error fetching alerts');
  }

  return response.json();
};
