import { createSlice } from '@reduxjs/toolkit';

const languageSlice = createSlice({
  name: 'language',
  initialState: { 
    data: [], // Array of language objects
    selected: 'en', // Currently selected language code
    loading: false 
  },
  reducers: {
    setLanguages: (state, action) => {
      state.data = action.payload; // Set the languages array
      state.loading = false;
    },
    setLanguage: (state, action) => {
      state.selected = action.payload; // Set selected language code
      state.loading = false;
    },
    setLoading: (state) => {
      state.loading = true;
    },
  },
});

export const { setLanguages, setLanguage, setLoading } = languageSlice.actions;
export default languageSlice.reducer;