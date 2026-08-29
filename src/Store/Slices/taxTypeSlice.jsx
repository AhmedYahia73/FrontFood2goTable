// store/slices/taxTypeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const taxTypeSlice = createSlice({
  name: 'taxType',
  initialState: { 
    data: null,
  },
  reducers: {
    setTaxType: (state, action) => {
      state.data = action.payload;
    },
    removeTaxType: (state) => {
      state.data = null;
    },
  },
});

export const { 
  setTaxType, 
  removeTaxType 
} = taxTypeSlice.actions;

export default taxTypeSlice.reducer;