import { createSlice } from '@reduxjs/toolkit';

const CategoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    data: null,
    loading: false,
    open: true,
    closeMessage: ''
  },
  reducers: {
    setCategories: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
    setRestaurantStatus: (state, action) => {
      state.open = action.payload.open;
      state.closeMessage = action.payload.closeMessage;
    },
    setLoading: (state) => {
      state.loading = true;
    },
  },
});

export const { setCategories, setRestaurantStatus, setLoading } = CategoriesSlice.actions;
export default CategoriesSlice.reducer;