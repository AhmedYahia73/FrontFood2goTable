import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import StaticSpinner from '../../Components/Spinners/StaticSpinner';
import { useGet } from '../../Hooks/useGet';
import { useTranslation } from 'react-i18next';
import { Star, Tag, Utensils } from 'lucide-react';

const ElectronicMenuLanding = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
    const isRTL = selectedLanguage === 'ar';
    const mainData = useSelector((state) => state.mainData?.data);
    const orderType = useSelector((state) => state.orderType?.orderType);
    const selectedAddressId = useSelector((state) => state.orderType?.selectedAddressId);
    const selectedBranchId = useSelector((state) => state.orderType?.selectedBranchId);

    // Build API URL for categories - wrapped in useCallback to prevent infinite loops/unnecessary updates
    const buildCategoriesUrl = React.useCallback(() => {
        let url = `${apiUrl}/customer/home/categories?locale=${selectedLanguage}`;
        if (selectedAddressId && orderType === 'delivery') {
            url += `&address_id=${selectedAddressId}`;
        } else if (selectedBranchId && orderType === 'take_away') {
            url += `&branch_id=${selectedBranchId}`;
        }
        return url;
    }, [apiUrl, selectedLanguage, selectedAddressId, selectedBranchId, orderType]);

    const {
        loading: loadingCategories,
        data: dataCategories,
        refetch: refetchCategories
    } = useGet({
        url: buildCategoriesUrl(),
    });

    // Explicitly refetch when dependencies change, matching OnlineMenu.jsx pattern
    useEffect(() => {
        refetchCategories();
    }, [buildCategoriesUrl, refetchCategories]);

    // const SPECIAL_CATEGORIES = [
    //     {
    //         id: 'recommended',
    //         name: t('recommendedProducts'),
    //         image_link: mainData?.logo_link,
    //         // description: t('checkoutRecommended') || 'Best selection just for you'
    //     },
    //     {
    //         id: 'offers',
    //         name: t('offersProducts'),
    //         image_link: mainData?.logo_link,
    //         // description: t('checkoutOffers') || 'Great deals and discounts'
    //     }
    // ];

    const handleCategoryClick = (id) => {
        navigate(`/electronic_menu/items?category=${id}`);
    };

    if (loadingCategories && !dataCategories) {
        return (
            <div className="flex justify-center items-center py-12 min-h-screen">
                <StaticSpinner />
            </div>
        );
    }

    const allCategories = [
        // ...SPECIAL_CATEGORIES,
        ...(dataCategories?.categories || []).map(cat => ({
            ...cat,
            // Use Utensils as default icon if no image/icon
            icon: !cat.image_link ? <Utensils size={32} className="text-mainColor" /> : null
        }))
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="w-full p-2 md:p-6">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">{t('ourMenu')}</h1>
                <p className="text-center text-gray-600 mb-8">{t('selectCategoryToViewProducts')}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {allCategories.map((category) => (
                        <div
                            key={category.id}
                            onClick={() => handleCategoryClick(category.id)}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 group border border-gray-100"
                        >
                            <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                <img
                                    src={category.image_link}
                                    alt={category.name}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        // Fallback to icon
                                        e.target.parentNode.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300" />
                            </div>
                            <div className="p-5 text-center">
                                <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-mainColor transition-colors">
                                    {category.name}
                                </h3>
                                {category.description && (
                                    <p className="text-sm text-gray-400 line-clamp-2">{category.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ElectronicMenuLanding;
