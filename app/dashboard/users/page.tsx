'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Search, Shield, UserCog, UserPlus, UserX, Users, X } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import {
  assignCouncilMembers,
  CouncilOwner,
  fetchCouncilOwners,
  fetchCurrentCouncilMembers,
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

interface AddCouncilMemberModalProps {
  token: string;
  complexId: string;
  onSuccess: () => void;
  onClose: () => void;
}

function AddCouncilMemberModal({ token, complexId, onSuccess, onClose }: AddCouncilMemberModalProps) {
  const [documentSearch, setDocumentSearch] = useState('');
  const [searchResults, setSearchResults] = useState<CouncilOwner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<CouncilOwner | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = documentSearch.replace(/\D/g, '');
    if (!normalized) {
      setSearchError('Ingresa una cédula válida para buscar.');
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedOwner(null);
    try {
      const owners = await fetchCouncilOwners(token, complexId, normalized);
      const eligible = owners.filter((o) => !o.isCouncilMember);
      setSearchResults(eligible);
      if (eligible.length === 0) {
        setSearchError(
          owners.length > 0
            ? 'El propietario encontrado ya es miembro activo del consejo.'
            : 'No se encontró ningún propietario activo con esa cédula en el conjunto.',
        );
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Error al buscar propietario.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedOwner) return;
    setIsAssigning(true);
    setAssignError(null);
    try {
      await assignCouncilMembers(token, complexId, [selectedOwner.profileId]);
      onSuccess();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Error al asignar al consejo.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2">
              <UserPlus className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Agregar miembro al consejo</h3>
              <p className="text-xs text-slate-500">Busca al propietario por cédula y asígnalo.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Cédula del propietario
            <input
              type="text"
              value={documentSearch}
              onChange={(e) => {
                setDocumentSearch(e.target.value);
                setSearchError(null);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-amber-500"
              placeholder="Ej: 1020304050"
              autoFocus
            />
          </label>
          <button
            type="submit"
            disabled={isSearching}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {searchError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {searchError}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-lg border border-slate-200">
            {Array.from(
              new Map(searchResults.map((o) => [`${o.profileId}-${o.apartmentId ?? ''}`, o])).values(),
            ).map((owner) => {
              const isSelected =
                selectedOwner?.profileId === owner.profileId &&
                selectedOwner?.apartmentId === owner.apartmentId;
              return (
                <button
                  key={`${owner.profileId}-${owner.apartmentId ?? ''}`}
                  type="button"
                  onClick={() => setSelectedOwner(owner)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-amber-50 ${
                    isSelected ? 'bg-amber-50 ring-2 ring-inset ring-amber-400' : ''
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                    {getInitials(owner.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{owner.fullName}</div>
                    <div className="truncate text-xs text-slate-500">
                      {owner.documentNumber} · {owner.apartmentLabel}
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />}
                </button>
              );
            })}
          </div>
        )}

        {assignError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {assignError}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedOwner || isAssigning}
            onClick={handleAssign}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {isAssigning ? 'Asignando...' : 'Asignar al consejo'}
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
  const [currentCouncilMembers, setCurrentCouncilMembers] = useState<CouncilOwner[]>([]);

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingCouncilMembers, setIsLoadingCouncilMembers] = useState(false);
  const [revokingProfileId, setRevokingProfileId] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const [listError, setListError] = useState<string | null>(null);
  const [councilMembersError, setCouncilMembersError] = useState<string | null>(null);
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

  const loadCouncilMembers = useCallback(async () => {
    if (!token || !complexId || !isAdmin) return;
    setIsLoadingCouncilMembers(true);
    setCouncilMembersError(null);
    try {
      const members = await fetchCurrentCouncilMembers(token, complexId);
      setCurrentCouncilMembers(members);
    } catch (err) {
      setCouncilMembersError(err instanceof Error ? err.message : 'No fue posible cargar el consejo.');
    } finally {
      setIsLoadingCouncilMembers(false);
    }
  }, [token, complexId, isAdmin]);

  useEffect(() => {
    if (token && complexId) {
      loadUsers();
      if (isAdmin) loadCouncilMembers();
    }
  }, [token, complexId, isAdmin, loadUsers, loadCouncilMembers]);

  const handleRevokeMember = async (member: CouncilOwner) => {
    if (!token || !complexId) return;
    setRevokingProfileId(member.profileId);
    setCouncilFeedback(null);
    try {
      const res = await revokeCouncilMembers(token, complexId, [member.profileId]);
      setCouncilFeedback({
        type: 'success',
        text: res.message || `${member.fullName} fue removido del consejo correctamente.`,
      });
      await loadCouncilMembers();
    } catch (err) {
      setCouncilFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'No fue posible revocar el miembro del consejo.',
      });
    } finally {
      setRevokingProfileId(null);
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
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Consejo de Administración</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Propietarios con acceso especial al panel de administración del conjunto.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  {currentCouncilMembers.length} {currentCouncilMembers.length === 1 ? 'miembro' : 'miembros'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  <UserPlus className="h-4 w-4" />
                  Agregar miembro
                </button>
              </div>
            </div>

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

            {councilMembersError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {councilMembersError}
              </div>
            )}

            {isLoadingCouncilMembers ? (
              <div className="text-sm text-slate-600">Cargando miembros del consejo...</div>
            ) : currentCouncilMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 py-12 text-center">
                <Shield className="h-8 w-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">No hay miembros del consejo aún.</p>
                <p className="text-xs text-slate-500">Agrega propietarios para conformar el consejo de administración.</p>
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="mt-1 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  <UserPlus className="h-4 w-4" />
                  Agregar primer miembro
                </button>
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
                      <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">
                        Miembro desde
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {currentCouncilMembers.map((member) => (
                      <tr
                        key={`${member.profileId}-${member.apartmentId ?? ''}`}
                        className="transition hover:bg-amber-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                              {getInitials(member.fullName)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900">{member.fullName}</div>
                              <div className="text-xs text-slate-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{member.documentNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{member.apartmentLabel}</td>
                        <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">
                          {member.grantedAt
                            ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(
                                new Date(member.grantedAt),
                              )
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={revokingProfileId === member.profileId}
                            onClick={() => handleRevokeMember(member)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            {revokingProfileId === member.profileId ? 'Revocando...' : 'Revocar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {isAddMemberModalOpen && token && complexId && (
        <AddCouncilMemberModal
          token={token}
          complexId={complexId}
          onSuccess={async () => {
            setIsAddMemberModalOpen(false);
            setCouncilFeedback({ type: 'success', text: 'Miembro del consejo asignado correctamente.' });
            await loadCouncilMembers();
          }}
          onClose={() => setIsAddMemberModalOpen(false)}
        />
      )}
    </>
  );
}
