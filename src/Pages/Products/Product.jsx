import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { setCategories, setRestaurantStatus } from '../../Store/Slices/CategoriesSlice';
import StaticSpinner from '../../Components/Spinners/StaticSpinner';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useGet } from '../../Hooks/useGet';
import ProductCard from '../../Components/ProductCard';
import { setTaxType } from '../../Store/Slices/taxTypeSlice';
import { useAuth } from '../../Context/Auth';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';

const Products = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const auth = useAuth();
  const { t } = useTranslation();
  const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
  const isRTL = selectedLanguage === 'ar';
  const tableId = localStorage.getItem('table_id');

  const [categoriesData, setCategoriesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(id ? parseInt(id) : null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const scrollContainerRef = useRef(null);

  // Build API URL for categories
  const buildCategoriesUrl = useCallback(() => {
    let url = `${apiUrl}/client/order/products/${tableId}?locale=${selectedLanguage}`;
    return url;
  }, [apiUrl, selectedLanguage, tableId]);

  // Build API URL for products
  const buildProductsUrl = useCallback(() => {
    if (!selectedCategory) return null;
    let url = `${apiUrl}/customer/home/products_in_category/${selectedCategory}?locale=${selectedLanguage}`;
    if (tableId) {
      url += `&table_id=${tableId}`;
    }
    return url;
  }, [apiUrl, selectedCategory, selectedLanguage, tableId]);

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
  }, [selectedLanguage, tableId, refetchCategories]);

  // Update categories data and store restaurant status
  useEffect(() => {
    if (dataCategories && !loadingCategories) {
      setCategoriesData(dataCategories.categories || []);

      // Store restaurant open status and close message
      dispatch(setRestaurantStatus({
        open: dataCategories.open ?? true,
        closeMessage: dataCategories.close_message || ''
      }));

      // Show toast if restaurant is closed
      if ((dataCategories.open === false || dataCategories.open === 0) && dataCategories.close_message) {
        auth.toastError(`${t('restaurantIsClosedNow')} \n ${dataCategories.close_message}`);
      }

      if (id && !selectedCategory) {
        setSelectedCategory(parseInt(id));
      }
    }
  }, [dataCategories, loadingCategories, id, selectedCategory, dispatch, auth, t]);

  // Auto-select first category if none selected
  useEffect(() => {
    if (!selectedCategory && categoriesData.length > 0) {
      const firstCategory = categoriesData[0].id;
      setSelectedCategory(firstCategory);
      const query = new URLSearchParams();
      if (tableId) {
        query.set('table_id', tableId);
      }
      navigate(`/products/${firstCategory}?${query.toString()}`, { replace: true });
    }
  }, [selectedCategory, categoriesData, tableId, navigate]);

  // Manage products loading state
  useEffect(() => {
    if (loadingProducts) {
      setIsProductsLoading(true);
      setProductsData([]);
      setFilteredProducts([]);
    } else {
      setIsProductsLoading(false);
    }
  }, [loadingProducts]);

  // Update products data
  useEffect(() => {
    if (dataProducts && !loadingProducts) {
      const prods = dataProducts.products || [];
      setProductsData(prods);
      setFilteredProducts(prods);
      dispatch(setTaxType(dataProducts.tax));
    }
  }, [dataProducts, loadingProducts, dispatch]);

  // Debounced search filtering
  const filterProducts = useCallback(
    debounce((query, products, subCategoryId) => {
      let filtered = products;
      if (subCategoryId) {
        filtered = filtered.filter((product) => product.sub_category_id === subCategoryId);
      }
      if (query) {
        filtered = filtered.filter((product) =>
          product.name.toLowerCase().includes(query.toLowerCase())
        );
      }
      setFilteredProducts(filtered);
    }, 300),
    []
  );

  // Update filtered products when products, subcategory, or search query changes
  useEffect(() => {
    filterProducts(searchQuery, productsData, selectedSubCategory);
  }, [productsData, selectedSubCategory, searchQuery, filterProducts]);

  // Refetch products when category changes
  useEffect(() => {
    if (selectedCategory) {
      setProductsData([]);
      setFilteredProducts([]);
      setSelectedSubCategory(null);
      setSearchQuery('');

      refetchProducts();
    }
  }, [selectedCategory, refetchProducts]);

  // RTL-aware scroll functions for categories
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = isRTL ? 300 : -300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = isRTL ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Handle category click
  const handleCategoryClick = useCallback(
    (categoryId) => {
      setProductsData([]);
      setFilteredProducts([]);
      setSelectedSubCategory(null);
      setSearchQuery('');

      setSelectedCategory(categoryId);
      const query = new URLSearchParams();
      if (tableId) {
        query.set('table_id', tableId);
      }
      navigate(`/products/${categoryId}?${query.toString()}`);
      window.scrollTo(0, 0);
    },
    [navigate, tableId]
  );

  // Handle subcategory click
  const handleSubCategoryClick = useCallback((subCategoryId) => {
    setSelectedSubCategory(subCategoryId);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const currentCategory = categoriesData.find((cat) => cat.id === selectedCategory);
  const subCategories = currentCategory?.sub_categories || [];

  // Show loading only if we're actively loading categories and no categories exist yet
  if (loadingCategories && categoriesData.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <StaticSpinner />
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-screen bg-gray-50"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Categories Navigation */}
      <div className="sticky top-0 z-20 bg-white shadow-md py-4 px-4">
        <div className="w-full relative">
          <div className={`flex items-center justify-between mb-4`}>
            <h2 className={`text-xl font-bold text-mainColor ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('categories')}
            </h2>
            {categoriesData.length > 1 && (
              <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-2'} space-x-2`}>
                <button
                  onClick={scrollLeft}
                  className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                  aria-label={isRTL ? t('scrollRight') : t('scrollLeft')}
                >
                  <ChevronLeft className={`h-5 w-5 text-gray-700 transform ${isRTL ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={scrollRight}
                  className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                  aria-label={isRTL ? t('scrollLeft') : t('scrollRight')}
                >
                  <ChevronRight className={`h-5 w-5 text-gray-700 transform ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {categoriesData.length > 0 ? (
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide pb-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                [isRTL ? 'paddingRight' : 'paddingLeft']: '0',
                [isRTL ? 'paddingLeft' : 'paddingRight']: '0'
              }}
            >
              <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3`}>
                {categoriesData.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-lg font-medium transition-colors ${selectedCategory === category.id
                      ? 'bg-mainColor text-whiteColor'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">{t('noCategoriesAvailable')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Subcategories */}
      {subCategories.length > 0 && (
        <div className="bg-white py-3 px-4 border-b">
          <div className="max-w-7xl mx-auto">
            <h3 className={`text-md font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('subcategories')}
            </h3>
            <div className="flex overflow-x-auto scrollbar-hide">
              <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-2'} space-x-2`}>
                <button
                  onClick={() => setSelectedSubCategory(null)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${selectedSubCategory === null
                    ? 'bg-mainColor text-whiteColor'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  {t('all')}
                </button>
                {subCategories.map((subCategory) => (
                  <button
                    key={subCategory.id}
                    onClick={() => handleSubCategoryClick(subCategory.id)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${selectedSubCategory === subCategory.id
                      ? 'bg-mainColor text-whiteColor'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                  >
                    {subCategory.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="w-full p-4">
        {/* Search Input */}
        <div className={`relative mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="w-full md:w-3/6 xl:w-2/6">
            <div className="relative flex-grow">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t('searchProductsPlaceholder')}
                className={`w-full py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-mainColor focus:border-mainColor transition-all duration-300 bg-white shadow-sm placeholder-gray-400 text-gray-800 ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'
                  }`}
              />
              <Search className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'
                }`} />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className={`absolute top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors ${isRTL ? 'left-3' : 'right-3'
                    }`}
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {isProductsLoading ? (
          <div className="flex justify-center items-center py-12">
            <StaticSpinner />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={product.favourite}
                language={selectedLanguage}
              />
            ))}
          </div>
        ) : (
          <div className={`text-center py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? t('noProductsMatchSearch')
                : selectedCategory && productsData.length === 0
                  ? t('noProductsInCategory')
                  : t('selectCategoryToViewProducts')
              }
            </p>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Products;