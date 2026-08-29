import React, { useEffect, useState } from 'react';
import { X, Heart } from 'lucide-react';
import { useGet } from '../../Hooks/useGet';
import StaticSpinner from '../../Components/Spinners/StaticSpinner';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const ProductDetailsViewOnly = ({ product, onClose, language }) => {
    const { t } = useTranslation();
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const user = useSelector(state => state.user?.data?.user);

    const savedOrderType = localStorage.getItem('orderType');

    let productDetailsUrl = `${apiUrl}/customer/home/product_item_web/${product.id}?locale=${language}`;

    // Fetch product details
    const {
        refetch: refetchProductDetails,
        loading: loadingProductDetails,
        data: productDetails,
    } = useGet({
        url: productDetailsUrl,
    });

    // Refetch when language changes
    useEffect(() => {
        refetchProductDetails();
    }, [language, refetchProductDetails]);

    if (loadingProductDetails) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="p-8 bg-white rounded-lg">
                    <StaticSpinner />
                </div>
            </div>
        );
    }

    const displayData = productDetails?.product || productDetails || product;
    const variations = displayData.variations || [];
    const addons = displayData.addons || [];
    const extras = displayData.allExtras || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-[100] flex items-center justify-between p-4 bg-white border-b shadow-sm">
                    <h2 className="text-xl font-bold text-mainColor truncate pr-4">
                        {displayData.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 transition-colors rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Image */}
                    <div className="mb-6">
                        <img
                            src={displayData.image_link}
                            alt={displayData.name}
                            className="object-contain w-full h-48 rounded-lg"
                        />
                    </div>

                    {/* Description */}
                    <p className="mb-6 text-gray-600">{displayData.description}</p>

                    {/* Price Display */}
                    <div className="p-3 mb-6 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">{t('price')}</span>
                            <div className="flex items-center gap-2">
                                {displayData.discount_val > 0 && (
                                    <span className="text-red-500 line-through">
                                        {displayData.price} {t('egp')}
                                    </span>
                                )}
                                <span className="text-lg font-bold text-mainColor">
                                    {displayData.price_after_discount || displayData.price} {t('egp')}
                                </span>
                            </div>
                        </div>
                        {displayData.tax_val > 0 && (
                            <div className="mt-1 text-sm text-gray-600">
                                {t('taxIncluded')}: {displayData.tax_val} {t('egp')}
                            </div>
                        )}
                    </div>

                    {/* Variations Display (Read Only) */}
                    {variations.length > 0 && (
                        <div className="mb-6">
                            <h3 className="mb-3 font-semibold border-b pb-2">{t('options')}</h3>
                            <div className="space-y-4">
                                {variations.map((variation) => (
                                    <div key={variation.id}>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">{variation.name}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {variation.options.map((option) => (
                                                <div key={option.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm border border-gray-200">
                                                    {option.name}
                                                    {option.price > 0 && <span className="text-mainColor ml-1">+{option.price} {t('egp')}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Addons Display (Read Only) */}
                    {addons.length > 0 && (
                        <div className="mb-6">
                            <h3 className="mb-3 font-semibold border-b pb-2">{t('addons')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {addons.map((addon) => (
                                    <div key={addon.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm border border-gray-200">
                                        {addon.name}
                                        {addon.price > 0 && <span className="text-mainColor ml-1">+{addon.price} {t('egp')}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Extras Display (Read Only) */}
                    {extras.length > 0 && (
                        <div className="mb-6">
                            <h3 className="mb-3 font-semibold border-b pb-2">{t('availableExtras')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {extras.map((extra) => (
                                    <div key={extra.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm border border-gray-200">
                                        {extra.name}
                                        {extra.price > 0 && <span className="text-mainColor ml-1">+{extra.price} {t('egp')}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ProductDetailsViewOnly;
