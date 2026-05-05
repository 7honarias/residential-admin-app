'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Search, Shield, UserCog, UserX, Users, X } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import {
  assignCouncilMembers,
  CouncilOwner,
  fetchCouncilOwners,
  revokeCouncilMembers,
} from '@/services/council.service';
import {
  ComplexUser,
  deactivateComplexUser,
  fetchComplexUsers,
} from '@/services/users.service';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase();
}

interface ConfirmDeactivateModalProps {
  user: ComplexUser;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeactivateModal({ user, isLoading, onConfirm, onCancel }: ConfirmDeactivateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-100 p-2">
              <UserX className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Desactivar usuario</h3>
              <p className="text-xs text-slate-500">Esta acción no puede deshacerse fácilmente.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-6 text-sm text-slate-700">
          ¿Estás seguro de que deseas desactivar a{' '}
          <span className="font-semibold text-slate-900">{user.fullName}</span>?{' '}
          El usuario perderá acceso al sistema inmediatamente.
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <UserX className="h-4 w-4" />
            {isLoading ? 'Desactivando...' : 'Sí, desactivar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const complexId = useAppSelector((state) => state.complex.activeComplex?.id);
  const isAdmin = user?.role === 'ADMIN';

  const [users, setUsers] = useState<ComplexUser[]>([]);
  const [councilOwners, setCouncilOwners] = useState<CouncilOwner[]>([]);
  const [documentSearch, setDocumentSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<CouncilOwner | null>(null);
  
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingCouncilOwners, setIsLoadingCouncilOwners] = useState(false);
  const [isUpdatingCouncil, setIsUpdatingCouncil] = useState(false);
  
  const [listError, setListError] = useState<string | null>(null);
  const [councilError, setCouncilError] = useState<string | null>(null);
  const [councilFeedback, setCouncilFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Deactivation state
  const [confirmUser, setConfirmUser] = useState<ComplexUser | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateFeedback, setDeactivateFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadUsers = useCallback(async () => {
    if (!token || !complexId) return;

    setIsLoadingUsers(true);
    setListError(null);

    try {
      const usersData = await fetchComplexUsers(token, complexId);
      setUsers(usersData);
    } catch (loadError) {
      setListError(loadError instanceof Error ? loadError.message : 'No fue posible cargar los usuarios.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [token, complexId]);

  const searchCouncilOwners = useCallback(async () => {
    if (!token || !complexId || !isAdmin) return;

    const normalizedDocument = documentSearch.replace(/\D/g, '');
    if (!normalizedDocument) {
      setCouncilError('Debes ingresar una cédula para buscar.');
      setCouncilOwners([]);
      setSelectedOwner(null);
      return;
    }

    setIsLoadingCouncilOwners(true);
    setCouncilError(null);

    try {
      const owners = await fetchCouncilOwners(token, complexId, normalizedDocument);
      setCouncilOwners(owners);
      setSelectedOwner(owners[0] || null);
    } catch (loadError) {
      setCouncilError(
        loadError instanceof Error ? loadError.message : 'No fue posible buscar propietarios por cédula.',
      );
    } finally {
      setIsLoadingCouncilOwners(false);
    }
  }, [token, complexId, isAdmin, documentSearch]);

  useEffect(() => {
    if (token && complexId) {
      loadUsers();
    }
  }, [token, complexId, loadUsers]);

  const handleCouncilMutation = async (action: 'assign' | 'revoke') => {
    if (!token || !complexId || !isAdmin || !selectedOwner) {
      if (!selectedOwner) {
        setCouncilFeedback({
          type: 'error',
          text: 'Busca y selecciona un propietario por cédula.',
        });
      }
      return;
    }

    if (action === 'assign' && selectedOwner.isCouncilMember) {
      setCouncilFeedback({
        type: 'error',
        text: 'El propietario ya es miembro activo del consejo.',
      });
      return;
    }

    if (action === 'revoke' && !selectedOwner.isCouncilMember) {
      setCouncilFeedback({
        type: 'error',
        text: 'El propietario seleccionado no es miembro activo del consejo.',
      });
      return;
    }

    const profileIds = [selectedOwner.profileId];

    setIsUpdatingCouncil(true);
    setCouncilFeedback(null);

    try {
      const response =
        action === 'assign'
          ? await assignCouncilMembers(token, complexId, profileIds)
          : await revokeCouncilMembers(token, complexId, profileIds);

      setCouncilFeedback({
        type: 'success',
        text:
          response.message ||
          (action === 'assign'
            ? 'Miembros del consejo asignados correctamente.'
            : 'Miembros del consejo removidos correctamente.'),
      });
      await searchCouncilOwners();
    } catch (mutationError) {
      setCouncilFeedback({
        type: 'error',
        text:
          mutationError instanceof Error
            ? mutationError.message
            : 'No fue posible actualizar la composición del consejo.',
      });
    } finally {
      setIsUpdatingCouncil(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!confirmUser || !token || !complexId) return;
    
    setIsDeactivating(true);
    try {
       // Llamada real al servicio
       await deactivateComplexUser(token, complexId, confirmUser.profileId, confirmUser.role);
       setDeactivateFeedback({ type: 'success', text: 'Usuario desactivado exitosamente.' });
       await loadUsers(); // Recargamos la tabla para reflejar el cambio
    } catch (err) {
       setDeactivateFeedback({ 
         type: 'error', 
         text: err instanceof Error ? err.message : 'Error al desactivar al usuario.' 
       });
    } finally {
       setIsDeactivating(false);
       setConfirmUser(null);
    }
  };

  return (
    <>
      {/* Renderizado Condicional del Modal */}
      {confirmUser && (
        <ConfirmDeactivateModal
          user={confirmUser}
          isLoading={isDeactivating}
          onConfirm={handleConfirmDeactivate}
          onCancel={() => setConfirmUser(null)}
        />
      )}

      <div className="flex flex-col gap-6">
        {/* User list */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Lista de colaboradores</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {users.length} registrados
            </span>
          </div>

          {deactivateFeedback && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
                deactivateFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {deactivateFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{deactivateFeedback.text}</span>
              <button
                type="button"
                onClick={() => setDeactivateFeedback(null)}
                className="ml-auto rounded p-0.5 transition hover:bg-black/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {listError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {listError}
            </div>
          )}

          {isLoadingUsers ? (
            <div className="text-sm text-slate-600">Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 py-12 text-center">
              <Users className="h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">No hay usuarios de seguridad o staff aún.</p>
              <p className="text-xs text-slate-500">Usa el botón Crear usuario para agregar el primero.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Correo
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">
                      Teléfono
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users.map((user) => (
                    <tr key={`${user.profileId}-${user.role}`} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                            {getInitials(user.fullName)}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{user.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{user.email}</td>
                      <td className="hidden px-4 py-3 text-sm text-slate-700 sm:table-cell">{user.phone}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.role === 'SECURITY'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {user.role === 'SECURITY' ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <UserCog className="h-3 w-3" />
                          )}
                          {user.role === 'SECURITY' ? 'Seguridad' : 'Staff'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setDeactivateFeedback(null);
                            setConfirmUser(user);
                          }}
                          title="Desactivar usuario"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 hover:border-rose-300"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Desactivar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Miembros del Consejo</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Busca al propietario por cédula para asignar o revocar su acceso especial al dashboard.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Resultado: {councilOwners.length}
                </span>
                <button
                  type="button"
                  disabled={isUpdatingCouncil || !selectedOwner || selectedOwner.isCouncilMember}
                  onClick={() => handleCouncilMutation('assign')}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingCouncil ? 'Procesando...' : 'Asignar consejo'}
                </button>
                <button
                  type="button"
                  disabled={isUpdatingCouncil || !selectedOwner || !selectedOwner.isCouncilMember}
                  onClick={() => handleCouncilMutation('revoke')}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Revocar consejo
                </button>
              </div>
            </div>

            <form
              className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                setCouncilFeedback(null);
                searchCouncilOwners();
              }}
            >
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Cédula del propietario
                <input
                  type="text"
                  value={documentSearch}
                  onChange={(event) => setDocumentSearch(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-amber-500"
                  placeholder="Ej: 1020304050"
                />
              </label>
              <button
                type="submit"
                disabled={isLoadingCouncilOwners}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {isLoadingCouncilOwners ? 'Buscando...' : 'Buscar por cédula'}
              </button>
            </form>

            {councilFeedback && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  councilFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {councilFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{councilFeedback.text}</span>
                <button
                  type="button"
                  onClick={() => setCouncilFeedback(null)}
                  className="ml-auto rounded p-0.5 transition hover:bg-black/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {councilError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {councilError}
              </div>
            )}

            {isLoadingCouncilOwners ? (
              <div className="text-sm text-slate-600">Cargando propietarios...</div>
            ) : councilOwners.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-600">
                No se encontró ningún propietario activo con esa cédula en el conjunto.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Propietario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Cédula
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Apartamento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Contacto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {/* Filtrar duplicados por profileId+apartmentId */}
                    {Array.from(
                      new Map(
                        councilOwners.map((owner) => [
                          `${owner.profileId}-${owner.apartmentId ?? ''}`,
                          owner,
                        ])
                      ).values()
                    ).map((owner) => {
                      const isSelected =
                        selectedOwner &&
                        selectedOwner.profileId === owner.profileId &&
                        selectedOwner.apartmentId === owner.apartmentId;
                      return (
                        <tr
                          key={`${owner.profileId}-${owner.apartmentId ?? ''}`}
                          className={`transition hover:bg-amber-50 cursor-pointer ${isSelected ? 'ring-2 ring-amber-400 bg-amber-50' : ''}`}
                          onClick={() => setSelectedOwner(owner)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                                {getInitials(owner.fullName)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">{owner.fullName}</div>
                                <div className="text-xs text-slate-500">{owner.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{owner.documentNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{owner.apartmentLabel}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{owner.phone || 'Sin teléfono'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                owner.isCouncilMember
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {owner.isCouncilMember ? 'Miembro activo' : 'Propietario elegible'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
