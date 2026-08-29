import { createSlice } from "@reduxjs/toolkit";

// Initial states
// Get initial table ID from localStorage if available
const getInitialTableId = () => {
  try {
    return localStorage.getItem("table_id");
  } catch (error) {
    console.error("Error accessing localStorage:", error);
    return '';
  }
};

const initialTableState = {
  data: getInitialTableId(),
};


/*  Table */
const tableSlice = createSlice({
  name: "table",
  initialState: initialTableState,
  reducers: {
    setTableId: (state, action) => {
      state.data = action.payload;

      // Also save to localStorage
      try {
        localStorage.setItem("table_id", action.payload);
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    },
    removeTableId: (state) => {
      state.data = '';

      // Also remove from localStorage
      try {
        localStorage.removeItem("table_id");
      } catch (error) {
        console.error("Error removing from localStorage:", error);
      }
    },
  },
});
export const { setTableId, removeTableId } = tableSlice.actions;
export default tableSlice.reducer;