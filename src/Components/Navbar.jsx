import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ShoppingCart, Heart, User, Phone, MapPin, Globe, Star, ChefHat, LogOut, Settings, Package, ShoppingBag, Clock } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { setLanguage, setLanguages } from '../Store/Slices/languageSlice';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import mainLogo from '../assets/Images/mainLogo.jpeg'
import { MdRoomService } from 'react-icons/md';

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const tableId = useSelector(state => state.table?.data);
    const mainData = useSelector(state => state.mainData?.data);
    const cart = useSelector(state => state.cart);
    const languages = useSelector(state => state.language?.data || []);
    const selectedLanguage = useSelector(state => state.language?.selected || 'en');
    const companyInfo = useSelector(state => state.maintenance?.data);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopLanguageDropdownOpen, setIsDesktopLanguageDropdownOpen] = useState(false);
    const [isMobileLanguageDropdownOpen, setIsMobileLanguageDropdownOpen] = useState(false);

    // Refs for click outside detection
    const desktopLanguageDropdownRef = useRef(null);
    const mobileLanguageDropdownRef = useRef(null);

    // Calculate real cart count
    const cartCount = cart?.itemCount || 0;

    // Check if current language is RTL
    const isRTL = selectedLanguage === 'ar';

    // Click outside handler for dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (desktopLanguageDropdownRef.current && !desktopLanguageDropdownRef.current.contains(event.target)) {
                setIsDesktopLanguageDropdownOpen(false);
            }
            if (mobileLanguageDropdownRef.current && !mobileLanguageDropdownRef.current.contains(event.target)) {
                setIsMobileLanguageDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const currentLanguageName = selectedLanguage.toUpperCase();

    const menuItems = [
        {
            icon: MapPin,
            i18nKey: 'branches',
            path: '/branches'
        },
        {
            icon: ChefHat,
            i18nKey: 'menu',
            path: '/menu'
        },
        {
            icon: ShoppingBag,
            i18nKey: 'electronicMenu',
            path: '/electronic_menu'
        },
        ...(tableId ? [{
            icon: MdRoomService,
            i18nKey: 'callWaiter',
            path: '/call_waiter'
        },
        {
            icon: Clock,
            i18nKey: 'orderTracking',
            path: '/my_orders'
        }] : []),
        ...(companyInfo?.company_info?.order_online === 1 ? [{
            icon: ShoppingCart,
            i18nKey: 'orderOnline',
            path: '/home'
        }] : []),
    ];

    const handleLanguageChange = (newLangCode) => {
        dispatch(setLanguage(newLangCode));
        setIsDesktopLanguageDropdownOpen(false);
        setIsMobileLanguageDropdownOpen(false);
    };

    const toggleDesktopLanguageDropdown = () => {
        setIsDesktopLanguageDropdownOpen(!isDesktopLanguageDropdownOpen);
        setIsMobileLanguageDropdownOpen(false);
    };

    const toggleMobileLanguageDropdown = () => {
        setIsMobileLanguageDropdownOpen(!isMobileLanguageDropdownOpen);
        setIsDesktopLanguageDropdownOpen(false);
    };

    const renderLogo = () => {
        return (
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3`}>
                <div className="flex items-center justify-center bg-white rounded-full shadow-md">
                    {mainData?.logo_link ? (
                        <img
                            src={mainData.logo_link}
                            alt={mainData?.name || "Logo"}
                            className="object-contain w-8 h-8 rounded-full sm:h-10 sm:w-10"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <ChefHat
                        className="w-8 h-8 sm:h-10 sm:w-10"
                        style={{
                            color: 'var(--color-main)',
                            display: mainData?.logo_link ? 'none' : 'flex'
                        }}
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-whiteColor lg:text-2xl leading-none">
                        {selectedLanguage === "en" ? mainData?.name : mainData?.ar_name || t('brandName')}
                    </span>
                    {tableId && (
                        <span className="text-xs text-whiteColor opacity-80 font-medium">
                            {t('table')}: {tableId}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const DesktopLanguageDropdown = () => (
        <div
            ref={desktopLanguageDropdownRef}
            className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-32 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-60 transition-all duration-200 ${isDesktopLanguageDropdownOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2 pointer-events-none'
                }`}
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
            {languages.map((lang) => (
                <button
                    key={lang.name}
                    onClick={() => handleLanguageChange(lang.name)}
                    className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-1 w-full px-8 py-2 transition-colors ${selectedLanguage === lang.name
                        ? 'bg-gray-100'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    style={selectedLanguage === lang.name ? { color: 'var(--color-main)' } : {}}
                >
                    <span className="text-lg">{lang.flag || '🌐'}</span>
                    <span className="flex-1 font-medium text-right">{lang.name.toUpperCase()}</span>
                </button>
            ))}
        </div>
    );

    const MobileLanguageDropdown = () => (
        <div
            ref={mobileLanguageDropdownRef}
            className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-32 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-60 transition-all duration-200 ${isMobileLanguageDropdownOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2 pointer-events-none'
                }`}
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
            {languages.map((lang) => (
                <button
                    key={lang.name}
                    onClick={() => handleLanguageChange(lang.name)}
                    className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3 w-full px-8 py-2 transition-colors ${selectedLanguage === lang.name
                        ? 'bg-gray-100'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    style={selectedLanguage === lang.name ? { color: 'var(--color-main)' } : {}}
                >
                    <span className="text-lg">{lang.flag || '🌐'}</span>
                    <span className="flex-1 font-medium text-right">{lang.name.toUpperCase()}</span>
                </button>
            ))}
        </div>
    );

    return (
        <>
            <nav
                className="relative z-40 shadow-lg"
                style={{ backgroundColor: 'var(--color-main)' }}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className="px-4 mx-auto max-w-7xl md:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        <Link to="/" className="flex-shrink-0 transition-opacity hover:opacity-90">
                            {renderLogo()}
                        </Link>

                        <div className={`hidden xl:flex xl:items-center xl:${isRTL ? 'space-x-4' : 'space-x-reverse'} space-x-4`}>
                            {menuItems.map((item, index) => (
                                <Link
                                    key={index}
                                    to={item.path}
                                    className={`text-whiteColor hover:text-gray-200 transition-all duration-200 font-medium flex items-center ${isRTL ? 'space-x-4' : 'space-x-reverse'} space-x-4 group relative`}
                                >
                                    <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                                    <span className={isRTL ? 'mr-1' : 'ml-1'}>{t(item.i18nKey)}</span>
                                </Link>
                            ))}
                        </div>

                        <div className={`hidden xl:flex xl:items-center ${isRTL ? 'space-x-reverse' : 'space-x-6'} space-x-6`}>
                            <Link
                                to="/cart"
                                className="relative p-2 text-whiteColor transition-colors hover:text-gray-200 group"
                            >
                                <ShoppingCart className="w-6 h-6 transition-transform group-hover:scale-110" />
                                {cartCount > 0 && (
                                    <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} bg-red-500 text-whiteColor text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold`}>
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            <div className="relative" ref={desktopLanguageDropdownRef}>
                                <button
                                    onClick={toggleDesktopLanguageDropdown}
                                    className={`text-whiteColor hover:text-gray-200 transition-colors flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-2'} space-x-2 bg-white bg-opacity-20 rounded-full px-4 py-2 group`}
                                >
                                    <Globe className="w-4 h-4" />
                                    <span className="font-medium">{currentLanguageName}</span>
                                </button>
                                <DesktopLanguageDropdown />
                            </div>
                        </div>

                        <div className={`xl:hidden flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-4'} space-x-4`}>
                            <Link to="/cart" className="relative p-2 text-whiteColor">
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} bg-red-500 text-whiteColor text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold`}>
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            <div className="relative" ref={mobileLanguageDropdownRef}>
                                <button
                                    onClick={toggleMobileLanguageDropdown}
                                    className={`text-whiteColor hover:text-gray-200 transition-colors flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-2'} space-x-2 bg-white bg-opacity-20 rounded-full px-4 py-2 group`}
                                >
                                    <Globe className="w-4 h-4" />
                                    <span className="font-medium">{currentLanguageName}</span>
                                </button>
                                <MobileLanguageDropdown />
                            </div>

                            <button
                                onClick={toggleMobileMenu}
                                className="p-2 text-whiteColor transition-colors bg-white rounded-lg hover:text-gray-200 bg-opacity-10"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div
                className={`fixed inset-0 z-50 xl:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                style={{ top: '4rem' }}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div
                    className={`absolute inset-0 bg-black transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-50' : 'opacity-0'
                        }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-80 max-w-full bg-white shadow-2xl transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
                    }`}>
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto scrollPage">
                            <div className="p-4 space-y-2">
                                {menuItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        to={item.path}
                                        className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-4'} space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <div className="flex items-center justify-center w-12 h-12 transition-colors rounded-xl group-hover:bg-opacity-20">
                                            <item.icon className="w-6 h-6" style={{ color: 'var(--color-main)' }} />
                                        </div>
                                        <span className={`flex-1 text-lg font-medium  text-gray-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                                            {t(item.i18nKey)}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <div className="flex items-center justify-center gap-2">
                                    <h1 className="text-gray-600">{t("Poweredby")}</h1>
                                    <img src={mainLogo} className="w-12 h-12" alt="Main Logo" />
                                </div>

                                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                                    <Link
                                        to="/support"
                                        className="hover:text-mainColor transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {t("support")}
                                    </Link>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <Link
                                        to="/policy"
                                        className="hover:text-mainColor transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {t("privacyPolicy")}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;