import { createSlice } from '@reduxjs/toolkit';

const RecommendedSlices = createSlice({
  name: 'recommendedProducts',
  initialState: { data: null, loading: false },
  reducers: {
    setRecommendedProducts: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
    setLoading: (state) => {
      state.loading = true;
    },
  },
});

export const { setRecommendedProducts, setLoading } = RecommendedSlices.actions;
export default RecommendedSlices.reducer;