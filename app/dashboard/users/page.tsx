'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Plus, Shield, UserCog, UserX, Users, X } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import {
  ComplexUser,
  createComplexUser,
  deactivateComplexUser,
  fetchComplexUsers,
  StaffRole,
} from '@/services/users.service';

interface UserFormState {
  fullName: string;
  email: string;
  phone: string;
  documentTypeCode: string;
  documentNumber: string;
  role: StaffRole;
}

const INITIAL_FORM: UserFormState = {
  fullName: '',
  email: '',
  phone: '',
  documentTypeCode: 'CC',
  documentNumber: '',
  role: 'SECURITY',
};

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
  const complexId = useAppSelector((state) => state.complex.activeComplex?.id);

  const [form, setForm] = useState<UserFormState>(INITIAL_FORM);
  const [users, setUsers] = useState<ComplexUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Deactivation state
  const [confirmUser, setConfirmUser] = useState<ComplexUser | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateFeedback, setDeactivateFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const updateField = <K extends keyof UserFormState>(field: K, value: UserFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

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

  useEffect(() => {
    if (token && complexId) {
      loadUsers();
    }
  }, [token, complexId, loadUsers]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !complexId) {
      setError('No hay sesión activa o conjunto seleccionado.');
      return;
    }

    resetMessages();
    setIsSubmitting(true);

    try {
      const response = await createComplexUser(token, complexId, form);
      setSuccess(response.message);
      setForm((prev) => ({ ...INITIAL_FORM, role: prev.role }));
      await loadUsers();
      setIsCreateOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No fue posible crear el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!token || !complexId || !confirmUser) return;

    setIsDeactivating(true);
    setDeactivateFeedback(null);

    try {
      const response = await deactivateComplexUser(token, complexId, confirmUser.profileId, confirmUser.role);
      setDeactivateFeedback({ type: 'success', text: response.message });
      await loadUsers();
    } catch (err) {
      setDeactivateFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'No fue posible desactivar el usuario.',
      });
    } finally {
      setIsDeactivating(false);
      setConfirmUser(null);
    }
  };

  if (!token || !complexId) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Selecciona un conjunto activo para gestionar usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {confirmUser && (
        <ConfirmDeactivateModal
          user={confirmUser}
          isLoading={isDeactivating}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setConfirmUser(null)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios Internos</h1>
              <p className="mt-1 text-sm text-slate-600">
                Administra personal de seguridad y staff del conjunto.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setIsCreateOpen((prev) => !prev);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              {isCreateOpen ? 'Cerrar formulario' : 'Crear usuario'}
            </button>
          </div>
        </div>

        {/* Create form */}
        {isCreateOpen && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Seguridad</h2>
                    <p className="text-xs text-slate-500">Personal de portería y control de accesos.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                    <UserCog className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Staff</h2>
                    <p className="text-xs text-slate-500">Equipo administrativo y operativo.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
                  Nombre completo
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="Ej: Laura Gómez"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Correo electrónico
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="nombre@correo.com"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Teléfono
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="3001234567"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Tipo de documento
                  <select
                    value={form.documentTypeCode}
                    onChange={(e) => updateField('documentTypeCode', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                    <option value="PAS">PAS</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700">
                  Número de documento
                  <input
                    type="text"
                    required
                    value={form.documentNumber}
                    onChange={(e) => updateField('documentNumber', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    placeholder="1020304050"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
                  Rol
                  <select
                    value={form.role}
                    onChange={(e) => updateField('role', e.target.value as StaffRole)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  >
                    <option value="SECURITY">Seguridad</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </label>

                {error && (
                  <div className="md:col-span-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="md:col-span-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{success}</span>
                  </div>
                )}

                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Creando usuario...' : 'Crear usuario'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* User list */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Lista de usuarios</h2>
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
      </div>
    </>
  );
}
