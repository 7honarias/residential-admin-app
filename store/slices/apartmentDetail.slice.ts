import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchApartmentDetail } from "../../services/apartments.service";
import { ApartmentDetail } from "@/app/dashboard/apartments/apartment.types";

interface ApartmentDetailState {
  data: ApartmentDetail | null;
  loading: boolean;
  error: string | null;
}

const initialState: ApartmentDetailState = {
  data: null,
  loading: false,
  error: null,
};

export const getApartmentDetail = createAsyncThunk(
  "apartmentDetail/getApartmentDetail",
  async (
    {
      token,
      complexId,
      apartmentId,
    }: { token: string; complexId: string; apartmentId: string },
    thunkAPI
  ) => {
    try {
      return await fetchApartmentDetail({
        token,
        complexId,
        apartmentId,
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const apartmentDetailSlice = createSlice({
  name: "apartmentDetail",
  initialState,
  reducers: {
    clearApartmentDetail: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getApartmentDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getApartmentDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getApartmentDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearApartmentDetail } = apartmentDetailSlice.actions;
export default apartmentDetailSlice.reducer;
