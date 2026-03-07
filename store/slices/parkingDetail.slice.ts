import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchParkingDetail } from "../../services/parking.service";
import { ParkingDetail } from "../../app/dashboard/parking/parking.types";

interface ParkingDetailState {
  data: ParkingDetail | null;
  loading: boolean;
  error: string | null;
}

const initialState: ParkingDetailState = {
  data: null,
  loading: false,
  error: null,
};

export const getParkingDetail = createAsyncThunk(
  "parkingDetail/getParkingDetail",
  async (
    {
      token,
      complexId,
      parkingId,
    }: { token: string; complexId: string; parkingId: string },
    thunkAPI
  ) => {
    try {
      return await fetchParkingDetail({
        token,
        complexId,
        parkingId: parkingId,
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const parkingDetailSlice = createSlice({
  name: "parkingDetail",
  initialState,
  reducers: {
    clearParkingDetail: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getParkingDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getParkingDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getParkingDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearParkingDetail } = parkingDetailSlice.actions;
export default parkingDetailSlice.reducer;
