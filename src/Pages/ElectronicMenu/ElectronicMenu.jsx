import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import StaticSpinner from '../../Components/Spinners/StaticSpinner';
import { useGet } from '../../Hooks/useGet';
import ProductCard from '../../Components/ProductCard';
import { setTaxType } from '../../Store/Slices/taxTypeSlice';
import { useAuth } from '../../Context/Auth';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronLeft, Star, Tag } from 'lucide-react';

const ElectronicMenu = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const auth = useAuth();
    const { t } = useTranslation();
    const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
    const isRTL = selectedLanguage === 'ar';
    const user = useSelector(state => state.user?.data?.user);

    const [categoriesData, setCategoriesData] = useState([]);
    const [productsData, setProductsData] = useState([]);
    const [isProductsLoading, setIsProductsLoading] = useState(false);

    // Extract query parameters DIRECTLY from URL
    const queryParams = new URLSearchParams(location.search);
    const urlCategoryId = queryParams.get('category');

    // Determine active category from URL or default to first available
    const activeCategory = urlCategoryId || (categoriesData.length > 0 ? categoriesData[0].id : null);


    // Build API URL for categories
    const buildCategoriesUrl = useCallback(() => {
        let url = `${apiUrl}/customer/home/categories?locale=${selectedLanguage}`;
        return url;
    }, [apiUrl, selectedLanguage]);

    // Build API URL for products
    const buildProductsUrl = useCallback(() => {
        if (!activeCategory) return null;

        let url = "";

        if (activeCategory === 'recommended') {
            url = `${apiUrl}/customer/home/recommandation_product?locale=${selectedLanguage}`;
        } else if (activeCategory === 'offers') {
            url = `${apiUrl}/customer/home/discount_product?locale=${selectedLanguage}`;
        } else {
            url = `${apiUrl}/customer/home/products_in_category/${activeCategory}?locale=${selectedLanguage}`;
        }

        return url;
    }, [apiUrl, activeCategory, selectedLanguage]);

    // Fetch categories
    const {
        refetch: refetchCategories,
        loading: loadingCategories,
        data: dataCategories,
    } = useGet({
        url: buildCategoriesUrl(),
    });

    // Fetch products
    const {
        refetch: refetchProducts,
        loading: loadingProducts,
        data: dataProducts,
    } = useGet({
        url: buildProductsUrl(),
    });

    // Refetch when language or location changes
    useEffect(() => {
        refetchCategories();
    }, [selectedLanguage, refetchCategories]);

    // Update categories data
    useEffect(() => {
        if (dataCategories && !loadingCategories) {
            // Merge special categories with fetched categories
            const fetchedCategories = dataCategories.categories || [];
            setCategoriesData([...fetchedCategories]);
        }
    }, [dataCategories, loadingCategories, t]);


    // Manage products loading state
    useEffect(() => {
        if (loadingProducts) {
            setIsProductsLoading(true);
            setProductsData([]);
        } else {
            setIsProductsLoading(false);
        }
    }, [loadingProducts]);

    // Update products data
    useEffect(() => {
        if (dataProducts && !loadingProducts) {
            let prods = [];
            if (activeCategory === 'recommended') {
                prods = dataProducts.recommended_products || [];
            } else if (activeCategory === 'offers') {
                prods = dataProducts.discount_products || [];
            } else {
                prods = dataProducts.products || [];
                dispatch(setTaxType(dataProducts.tax));
            }
            setProductsData(prods);
        }
    }, [dataProducts, loadingProducts, dispatch, activeCategory]);

    // Refetch products when category changes
    useEffect(() => {
        if (activeCategory) {
            refetchProducts();
        }
    }, [activeCategory, refetchProducts]);

    const handleCategoryClick = (categoryId) => {
        const newParams = new URLSearchParams(location.search);
        newParams.set('category', categoryId);
        navigate({ search: newParams.toString() }, { replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Only show spinner if we have NO data at all (not even special categories)
    if (loadingCategories && categoriesData.length === 0) {
        return (
            <div className="flex justify-center items-center py-12 min-h-screen">
                <StaticSpinner />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="w-full py-6 px-4">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Categories Sidebar (Desktop) */}
                    <div className="hidden lg:block w-1/4 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-md p-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
                            <h2 className={`text-xl font-bold text-mainColor mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t('categories')}
                            </h2>
                            <div className="flex flex-col space-y-2">
                                {categoriesData.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategoryClick(category.id)}
                                        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-200 ${String(activeCategory) === String(category.id)
                                            ? 'bg-mainColor text-white shadow-lg'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {category.icon ? (
                                                <div className={`w-8 h-8 flex items-center justify-center bg-white rounded-full ${String(activeCategory) === String(category.id) ? 'text-mainColor' : ''}`}>
                                                    {category.icon}
                                                </div>
                                            ) : (
                                                <img
                                                    src={category.image_link}
                                                    alt={category.name}
                                                    className="w-8 h-8 rounded-full object-cover bg-white"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            )}
                                            <span className="font-medium text-start">{category.name}</span>
                                        </div>
                                        {isRTL ? (
                                            <ChevronLeft size={16} className={String(activeCategory) === String(category.id) ? 'text-white' : 'text-gray-400'} />
                                        ) : (
                                            <ChevronRight size={16} className={String(activeCategory) === String(category.id) ? 'text-white' : 'text-gray-400'} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Categories Horizontal Scroll (Mobile) */}
                    <div className="lg:hidden w-full mb-2">
                        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
                            {categoriesData.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category.id)}
                                    className={`flex flex-col items-center flex-shrink-0 min-w-[80px] p-2 rounded-xl transition-all duration-200 ${String(activeCategory) === String(category.id)
                                        ? 'bg-mainColor text-white shadow-md transform scale-105'
                                        : 'bg-white text-gray-700 shadow-sm border border-gray-100'
                                        }`}
                                >
                                    <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 ${String(activeCategory) === String(category.id) ? 'bg-white/20' : 'bg-gray-50'
                                        }`}>
                                        {category.icon ? (
                                            <div className={String(activeCategory) === String(category.id) ? 'text-white' : 'text-mainColor'}>
                                                {React.cloneElement(category.icon, {
                                                    size: 24,
                                                    className: String(activeCategory) === String(category.id) ? 'text-white' : (category.id === 'recommended' ? 'text-amber-500' : category.id === 'offers' ? 'text-red-500' : 'text-gray-600')
                                                })}
                                            </div>
                                        ) : (
                                            <img
                                                src={category.image_link}
                                                alt={category.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <span className="text-xs font-semibold text-center line-clamp-1 max-w-[80px]">
                                        {category.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="w-full lg:w-3/4">
                        {/* Header for Products Section */}
                        {activeCategory && (
                            <div className="mb-6">
                                <h2 className={`text-2xl font-bold text-gray-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {categoriesData.find(c => c.id === activeCategory)?.name || t('products')}
                                </h2>
                            </div>
                        )}

                        {isProductsLoading ? (
                            <div className="flex justify-center items-center py-12 h-64">
                                <StaticSpinner />
                            </div>
                        ) : productsData.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {productsData.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        isFavorite={product.favourite}
                                        language={selectedLanguage}
                                        showActions={false} // Disable actions for Online Menu
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                    </svg>
                                </div>
                                <p className="text-lg text-gray-500 font-medium">{t('noProductsAvailable')}</p>
                                <p className="text-sm text-gray-400 mt-2">{t('selectDifferentCategory')}</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ElectronicMenu;

const styles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
  /* For Firefox */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f1f1f1;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
