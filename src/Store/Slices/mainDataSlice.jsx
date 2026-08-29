import { createSlice } from '@reduxjs/toolkit';

const mainDataSlice = createSlice({
  name: 'mainData',
  initialState: { data: null, loading: false },
  reducers: {
    setMainData: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
    setLoading: (state) => {
      state.loading = true;
    },
  },
});

export const { setMainData, setLoading } = mainDataSlice.actions;
export default mainDataSlice.reducer;