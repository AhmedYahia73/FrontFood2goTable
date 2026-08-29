import React, { createContext, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { removeTableId, setTableId } from "../Store/Slices/tableSlice";

// Create a context
const TableContext = createContext();

export const ContextProvider = ({ children }) => {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.table.data);

  const [userTable, setUserTableState] = useState(() => userData || null);

  const login = (data) => {
    setUserTableState(data); // Update local state
    dispatch(setTableId(data)); // Dispatch to Redux
    toast.success(`${t('table')} ${data || '-'}`);
  };

  const logout = () => {
    setUserTableState(null);
    dispatch(removeTableId()); // Remove from Redux
    localStorage.removeItem('table_id');
    toast.success("Table cleared");
  };

  return (
    <TableContext.Provider
      value={{
        userTable,
        login,
        logout,
        toastSuccess: (text) => toast.success(text),
        toastError: (text) => toast.error(text),
      }}
    >
      <ToastContainer />
      {children}
    </TableContext.Provider>
  );
};

// Custom hook to use table context
export const useAuth = () => {
  const context = React.useContext(TableContext);
  if (!context) {
    throw new Error("useAuth must be used within a ContextProvider");
  }
  return context;
};