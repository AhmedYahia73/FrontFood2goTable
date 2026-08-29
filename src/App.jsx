import React, { useEffect, useRef, lazy, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/lara-light-blue/theme.css";
import { useGet } from "./Hooks/useGet";
import { useTranslation } from "react-i18next";
import "./index.css";
import "./i18n";
import LoaderLogin from "./Components/Spinners/LoaderLogin";
import { setMaintenance } from "./Store/Slices/maintenanceSlice";
import { setLanguages } from "./Store/Slices/languageSlice";
import { setMainData } from "./Store/Slices/mainDataSlice";
import Navbar from "./Components/Navbar";

const App = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const mainData = useSelector((state) => state.mainData?.data);
  const selectedLanguage = useSelector((state) => state.language?.selected); // Add this line
  const dispatch = useDispatch();
  const location = useLocation();
  const { i18n } = useTranslation(); // You already have this
  const scrollContainerRef = useRef(null);

  // ✅ ADD THIS USEEFFECT FOR LANGUAGE PERSISTENCE
  useEffect(() => {
    if (selectedLanguage) {
      i18n.changeLanguage(selectedLanguage);
      document.documentElement.dir = selectedLanguage === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = selectedLanguage;
    }
  }, [selectedLanguage, i18n]);

  const {
    refetch: refetchMaintenance,
    loading: loadingMaintenance,
    data: dataMaintenance,
  } = useGet({
    url: `${apiUrl}/api/business_setup`,
  });

  const {
    refetch: refetchLanguage,
    loading: loadingLanguageData,
    data: dataLanguages,
  } = useGet({
    url: `${apiUrl}/customer/home/translation`,
  });

  const {
    refetch: refetchMainData,
    loading: loadingMainData,
    data: dataMainData,
  } = useGet({
    url: `${apiUrl}/customer/home/main_data`,
  });

  // ✅ Trigger all fetches on mount
  useEffect(() => {
    refetchMaintenance();
    refetchLanguage();
    refetchMainData();
  }, [refetchMaintenance, refetchLanguage, refetchMainData]);

  useEffect(() => {
    if (dataMainData && dataMainData.main_data) {
      dispatch(setMainData(dataMainData.main_data));
    }
  }, [dataMainData, dispatch]);

  useEffect(() => {
    if (dataMaintenance) {
      dispatch(setMaintenance(dataMaintenance));
    }
  }, [dataMaintenance, dispatch]);

  useEffect(() => {
    if (dataLanguages && dataLanguages.translation) {
      dispatch(setLanguages(dataLanguages.translation));
    }
  }, [dataLanguages, dispatch]);

  // Update title, favicon, and theme colors
  useEffect(() => {
    if (mainData) {
      document.title = mainData?.name || "Food2go Ordering";
      const favicon = document.querySelector("link[rel='icon']");
      if (favicon && mainData?.logo_link) favicon.href = mainData?.logo_link;

      const rootStyle = document.documentElement.style;
      if (mainData?.first_color)
        rootStyle.setProperty("--color-main", mainData.first_color);
      if (mainData?.second_color)
        rootStyle.setProperty("--color-second", mainData.second_color);
      if (mainData?.third_color)
        rootStyle.setProperty("--color-third", mainData.third_color);
    }
  }, [mainData]);

  // Scroll to top on route change
  useEffect(() => {
    if (location.pathname && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [location.pathname]);

  const isLoadingInitialData =
    loadingMainData || loadingLanguageData || loadingMaintenance;
  const isArabic = i18n.language === "ar";

  return (
    <PrimeReactProvider>
      {isLoadingInitialData ? (
        <div className="flex items-center justify-center w-full h-screen">
          <LoaderLogin />
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          dir={isArabic ? "rtl" : "ltr"}
          className="relative flex flex-col items-center w-full h-screen overflow-x-hidden overflow-y-scroll bg-gradient-to-b from-gray-50 to-white"
        >
          <div className="sticky top-0 z-40 w-full">
            <Navbar />
          </div>
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      )}
    </PrimeReactProvider>
  );
};

export default App;