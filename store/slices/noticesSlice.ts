import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  INotice,
  INoticeFormData,
  IBlock,
  IApartmentOption,
} from "@/app/dashboard/notices/notices.types";

interface NoticesState {
  // List state
  notices: INotice[];
  nextCursor: string | null;
  isLoadingNotices: boolean;
  errorNotices: string | null;

  // Form state
  formData: INoticeFormData;
  isShowingForm: boolean;
  isShowingPreview: boolean;

  // Metadata for form
  blocks: IBlock[];
  apartments: IApartmentOption[];
  isLoadingBlocks: boolean;
  isLoadingApartments: boolean;

  // Create state
  isCreating: boolean;
  errorCreating: string | null;
  successMessage: string | null;
}

const initialFormData: INoticeFormData = {
  title: "",
  message: "",
  type: "INFO",
  scope: "GLOBAL",
  target_id: null,
};

const initialState: NoticesState = {
  // List state
  notices: [],
  nextCursor: null,
  isLoadingNotices: false,
  errorNotices: null,

  // Form state
  formData: initialFormData,
  isShowingForm: false,
  isShowingPreview: false,

  // Metadata
  blocks: [],
  apartments: [],
  isLoadingBlocks: false,
  isLoadingApartments: false,

  // Create state
  isCreating: false,
  errorCreating: null,
  successMessage: null,
};

const noticesSlice = createSlice({
  name: "notices",
  initialState,
  reducers: {
    // ===== List & Fetching =====
    setNoticesLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingNotices = action.payload;
      if (action.payload) {
        state.errorNotices = null;
      }
    },

    setNotices: (
      state,
      action: PayloadAction<{ notices: INotice[]; nextCursor: string | null }>
    ) => {
      state.notices = action.payload.notices;
      state.nextCursor = action.payload.nextCursor;
      state.isLoadingNotices = false;
    },

    appendNotices: (
      state,
      action: PayloadAction<{ notices: INotice[]; nextCursor: string | null }>
    ) => {
      state.notices = [...state.notices, ...action.payload.notices];
      state.nextCursor = action.payload.nextCursor;
      state.isLoadingNotices = false;
    },

    prependNotice: (state, action: PayloadAction<INotice>) => {
      state.notices.unshift(action.payload);
    },

    setNoticesError: (state, action: PayloadAction<string | null>) => {
      state.errorNotices = action.payload;
      state.isLoadingNotices = false;
    },

    // ===== Form Management =====
    openForm: (state) => {
      state.isShowingForm = true;
      state.formData = initialFormData;
      state.isShowingPreview = false;
      state.errorCreating = null;
      state.successMessage = null;
    },

    closeForm: (state) => {
      state.isShowingForm = false;
      state.isShowingPreview = false;
      state.formData = initialFormData;
      state.errorCreating = null;
      state.successMessage = null;
    },

    updateFormData: (state, action: PayloadAction<Partial<INoticeFormData>>) => {
      state.formData = { ...state.formData, ...action.payload };
    },

    setFormData: (state, action: PayloadAction<INoticeFormData>) => {
      state.formData = action.payload;
    },

    // ===== Preview Management =====
    showPreview: (state) => {
      state.isShowingPreview = true;
    },

    hidePreview: (state) => {
      state.isShowingPreview = false;
    },

    // ===== Blocks & Apartments =====
    setBlocksLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingBlocks = action.payload;
    },

    setBlocks: (state, action: PayloadAction<IBlock[]>) => {
      state.blocks = action.payload;
      state.isLoadingBlocks = false;
    },

    setApartmentsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingApartments = action.payload;
    },

    setApartments: (state, action: PayloadAction<IApartmentOption[]>) => {
      state.apartments = action.payload;
      state.isLoadingApartments = false;
    },

    // ===== Create Notice =====
    setCreatingNotice: (state, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload;
      if (action.payload) {
        state.errorCreating = null;
        state.successMessage = null;
      }
    },

    setCreateNoticeError: (state, action: PayloadAction<string | null>) => {
      state.errorCreating = action.payload;
      state.isCreating = false;
    },

    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
    },

    // ===== Reset State =====
    resetNotices: () => initialState,
  },
});

export const {
  setNoticesLoading,
  setNotices,
  appendNotices,
  prependNotice,
  setNoticesError,
  openForm,
  closeForm,
  updateFormData,
  setFormData,
  showPreview,
  hidePreview,
  setBlocksLoading,
  setBlocks,
  setApartmentsLoading,
  setApartments,
  setCreatingNotice,
  setCreateNoticeError,
  setSuccessMessage,
  resetNotices,
} = noticesSlice.actions;

export default noticesSlice.reducer;
