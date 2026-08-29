import maintenanceReducer from './Slices/maintenanceSlice';
import languageReducer from './Slices/languageSlice';
import mainDataReducer from './Slices/mainDataSlice';
import taxTypeSlice from './Slices/taxTypeSlice';
import cartSlice from './Slices/cartSlice';
import tableReducer from './Slices/tableSlice';
import categoriesReducer from './Slices/CategoriesSlice';
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

const reducers = combineReducers({
  table: tableReducer,
  maintenance: maintenanceReducer,
  language: languageReducer,
  mainData: mainDataReducer,
  cart: cartSlice,
  taxType: taxTypeSlice,
  categories: categoriesReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['table', 'mainData', 'maintenance', 'language',], // persisted state
};

const persistedReducer = persistReducer(persistConfig, reducers);

export const StoreApp = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export const persistor = persistStore(StoreApp);