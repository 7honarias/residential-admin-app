import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Complex {
  id: string;
  name: string;
  address?: string;
}

interface ComplexState {
  complexes: Complex[];
  activeComplex: Complex | null;
}

const initialState: ComplexState = {
  complexes: [],
  activeComplex: null,
};

const complexSlice = createSlice({
  name: "complex",
  initialState,
  reducers: {
    setComplexes: (state, action: PayloadAction<Complex[]>) => {
      state.complexes = action.payload;
    },
    setActiveComplex: (state, action: PayloadAction<Complex>) => {
      state.activeComplex = action.payload;

      if (typeof window !== "undefined") {
        localStorage.setItem("activeComplexId", action.payload.id);
      }
    },
    clearComplex: (state) => {
      state.complexes = [];
      state.activeComplex = null;
    },
  },
});

export const { setComplexes, setActiveComplex, clearComplex } =
  complexSlice.actions;

export default complexSlice.reducer;
