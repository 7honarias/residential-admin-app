import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Membership {
  complex_id: string;
  apartment_id: string | null;
  role: string;
  is_active: boolean;
  granted_roles: string[];
  permissions: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  memberships: Membership[];
  grantedRoles: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ token: string; user: User }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    updateRole: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.role = action.payload;
      }
    },
    syncComplexAccess: (state, action: PayloadAction<string>) => {
      if (!state.user) {
        return;
      }

      const activeMembership = state.user.memberships.find(
        (membership) => membership.complex_id === action.payload && membership.is_active,
      );

      if (!activeMembership) {
        state.user.grantedRoles = [];
        state.user.permissions = [];
        return;
      }

      state.user.role = activeMembership.role;
      state.user.grantedRoles = activeMembership.granted_roles || [];
      state.user.permissions = activeMembership.permissions || [];
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
    restoreSession: (
      state,
      action: PayloadAction<{ token: string; user: User }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
  },
});

export const { setAuth, updateRole, syncComplexAccess, logout, restoreSession } = authSlice.actions;
export default authSlice.reducer;
