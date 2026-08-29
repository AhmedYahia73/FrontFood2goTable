import { createSlice } from '@reduxjs/toolkit';

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState: { data: null, loading: false },
  reducers: {
    setMaintenance: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
    setLoading: (state) => {
      state.loading = true;
    },
  },
});

export const { setMaintenance, setLoading } = maintenanceSlice.actions;
export default maintenanceSlice.reducer;



