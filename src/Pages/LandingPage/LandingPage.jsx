import React, { useEffect } from "react";
import mainLogo from '../../assets/Images/mainLogo.jpeg'
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { MdOutlineRestaurantMenu, MdRoomService, MdMenuBook, MdQrCode, MdTableBar } from "react-icons/md";
import { FaLock } from "react-icons/fa";
import { setTableId } from "../../Store/Slices/tableSlice";

const LandingPage = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const tableId = searchParams.get("table_id");

    useEffect(() => {
        if (tableId) {
            dispatch(setTableId(tableId));
        }
    }, [tableId, dispatch]);

    const mainData = useSelector(state => state.mainData?.data);
    const companyInfo = useSelector(state => state.maintenance?.data);
    const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
    const reduxTableId = useSelector(state => state.table?.data);
    const effectiveTableId = tableId || reduxTableId;

    return (
        <div className="w-full mt-1 md:mt-10 max-h-screen flex flex-col gap-4 items-center justify-center overflow-hidden">
            <div className="w-full flex flex-col md:flex-row pb-0 p-2 md:p-6">

                {/* Left Side: Logo and Name */}
                <div className="w-full md:w-1/2 flex flex-col gap-3 items-center">
                    <img src={mainData?.logo_link} width={180} height={180} alt="Main Logo" />
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h1 className="text-2xl font-semibold text-mainColor">
                            {selectedLanguage === "en" ? mainData?.name : mainData?.ar_name}
                        </h1>

                        {effectiveTableId && (
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="flex items-center justify-center w-12 h-12 bg-thirdColor rounded-xl shadow-inner group-hover:rotate-12 transition-transform">
                                    <MdTableBar className="text-mainColor text-2xl" />
                                </div>
                                <div className="flex gap-2 items-center ">
                                    <span className="text-3xl font-bold text-gray-600">{t("table")} :</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-mainColor leading-none">{effectiveTableId}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Navigation and Store Links */}
                <div className="w-full md:w-1/2 flex flex-col gap-3 p-2 md:p-4 items-center justify-center">
                    <div className="wflex flex-col gap-5">
                        <div className="w-full grid grid-cols-2 gap-4">
                            <Link to="/electronic_menu" className="bg-thirdColor flex flex-col gap-3 items-center justify-center rounded-xl p-4 md:p-6 transition-transform hover:scale-105">
                                <MdQrCode size={86} className="text-mainColor" />
                                <h1 className="text-xl md:text-2xl text-mainColor text-center">{t("electronicMenu")}</h1>
                            </Link>
                            <Link to="/menu" className="bg-thirdColor flex flex-col gap-3 items-center justify-center rounded-xl p-4 md:p-6 transition-transform hover:scale-105">
                                <MdMenuBook size={86} className="text-mainColor" />
                                <h1 className="text-xl md:text-2xl text-mainColor text-center">{t("menu")}</h1>
                            </Link>

                            <Link
                                to={companyInfo?.company_info?.order_online === 1 ? "/home" : "#"}
                                className={`bg-thirdColor flex flex-col gap-3 items-center justify-center rounded-xl p-4 md:p-6 relative overflow-hidden transition-transform hover:scale-105 ${companyInfo?.company_info?.order_online === 0 ? 'cursor-not-allowed opacity-80' : ''}`}
                                onClick={(e) => {
                                    if (companyInfo?.company_info?.order_online === 0) e.preventDefault();
                                }}
                            >
                                <MdOutlineRestaurantMenu size={86} className="text-mainColor" />
                                <h1 className="text-xl md:text-2xl text-mainColor text-center">{t("orderNow")}</h1>

                                {companyInfo?.company_info?.order_online === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                                        <FaLock className="text-white text-3xl drop-shadow-md" />
                                    </div>
                                )}
                            </Link>

                            {effectiveTableId && (
                                <Link to="/call_waiter" className="bg-thirdColor flex flex-col gap-3 items-center justify-center rounded-xl p-4 md:p-6 transition-transform hover:scale-105">
                                    <MdRoomService size={86} className="text-mainColor" />
                                    <h1 className="text-xl md:text-2xl text-mainColor text-center">{t("callWaiter")}</h1>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col items-center justify-center gap-2">
                <Link to="https://food2go.online/" target="_blank" className="flex items-center justify-center gap-2">
                    <h1 className="text-gray-600">{t("Poweredby")}</h1>
                    <img src={mainLogo} className="w-16 h-16" alt="Main Logo" />
                </Link>
            </div>
        </div >
    );
}

export default LandingPage;