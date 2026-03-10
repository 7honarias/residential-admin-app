import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import complexReducer from "./slices/complexSlice";
import apartmentDetailReducer from "./slices/apartmentDetail.slice";
import parkingDetailReducer from "./slices/parkingDetail.slice";
import noticesReducer from "./slices/noticesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    complex: complexReducer,    
    apartmentDetail: apartmentDetailReducer,
    parkingDetail: parkingDetailReducer,
    notices: noticesReducer,
  },
});

// Tipos automáticos
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
