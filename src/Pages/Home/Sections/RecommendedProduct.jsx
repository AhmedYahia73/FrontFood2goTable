import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRecommendedProducts } from './../../../Store/Slices/RecommendedSlices';
import StaticSpinner from '../../../Components/Spinners/StaticSpinner';
import { ChevronLeft, ChevronRight, Play, Pause, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGet } from '../../../Hooks/useGet';
import ProductDetails from '../../Products/ProductDetails';
import { useTranslation } from 'react-i18next';

const RecommendedProduct = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
  const { t } = useTranslation();
  const isRTL = selectedLanguage === 'ar';

  const dispatch = useDispatch();
  const scrollContainerRef = useRef(null);
  const autoScrollRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [recommendedProductsData, setRecommendedProductsData] = useState(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const {
    refetch: refetchRecommendedProducts,
    loading: loadingRecommendedProducts,
    data: dataRecommendedProducts,
  } = useGet({
    url: `${apiUrl}/customer/home/recommandation_product?&locale=${selectedLanguage}`,
  });

  // Refetch products when language changes
  useEffect(() => {
    refetchRecommendedProducts();
  }, [selectedLanguage, refetchRecommendedProducts]);

  // Store the data in state
  useEffect(() => {
    if (dataRecommendedProducts && !loadingRecommendedProducts) {
      setRecommendedProductsData(dataRecommendedProducts.recommended_products);
      dispatch(setRecommendedProducts(dataRecommendedProducts?.recommended_products || []));
    }
  }, [dataRecommendedProducts, dispatch]);

  // Auto-scroll functionality with RTL support
  useEffect(() => {
    if (!scrollContainerRef.current || !isPlaying || !recommendedProductsData || recommendedProductsData.length === 0) return;

    const scrollContainer = scrollContainerRef.current;
    const scrollWidth = scrollContainer.scrollWidth;
    const clientWidth = scrollContainer.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 0) return;

    autoScrollRef.current = setInterval(() => {
      const currentScroll = scrollContainer.scrollLeft;

      if (isRTL) {
        // RTL scrolling logic
        if (currentScroll <= 5) {
          scrollContainer.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
          scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
        }
      } else {
        // LTR scrolling logic
        if (currentScroll >= maxScroll - 5) {
          scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 6000);

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isPlaying, recommendedProductsData, isRTL]);

  // RTL-aware scroll functions
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

  const toggleAutoScroll = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle open product details dialog
  const handleProductClick = (product, e) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setShowProductDialog(true);
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setShowProductDialog(false);
    setSelectedProduct(null);
  };

  // Show loading if data is not available yet
  if (loadingRecommendedProducts) {
    return (
      <div className="w-full py-16 text-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-mainColor mx-auto mb-4"></div>
      </div>
    );
  }

  if (!recommendedProductsData || recommendedProductsData.length === 0) {
    return <></>;
  }

  return (
    <section
      className="w-full py-4 px-4 relative"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full md:px-8">
        {/* Section Header */}
        <div className={`flex justify-between items-center mb-8`}>
          <div>
            <h2 className={`text-xl md:text-3xl font-bold text-mainColor ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('recommendedProducts')}
            </h2>
            <p className={`text-gray-600 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('speciallySelectedForYou')}
            </p>
          </div>

          {/* Navigation Controls - Only show if multiple products */}
          {recommendedProductsData.length > 1 && (
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-3'} space-x-3`}>
              <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-2'} space-x-2`}>
                <button
                  onClick={scrollLeft}
                  className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                  aria-label={isRTL ? t('scrollRight') : t('scrollLeft')}
                >
                  <ChevronLeft className={`h-5 w-5 text-gray-700 transform ${isRTL ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={toggleAutoScroll}
                  className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                  aria-label={isRTL ? t('scrollLeft') : t('scrollRight')}
                >
                  {isPlaying ? <Pause className="h-5 w-5 text-gray-700" /> : <Play className="h-5 w-5 text-gray-700" />}
                </button>
                <button
                  onClick={scrollRight}
                  className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                  aria-label={isRTL ? t('scrollLeft') : t('scrollRight')}
                >
                  <ChevronRight className={`h-5 w-5 text-gray-700 transform ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Swiper */}
        <div className="relative group">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide pb-6 -mx-4 px-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              [isRTL ? 'paddingRight' : 'paddingLeft']: '0',
              [isRTL ? 'paddingLeft' : 'paddingRight']: '0'
            }}
          >
            <div className={`flex ${isRTL ? 'space-x-reverse' : 'space-x-4'} space-x-4`}>
              {recommendedProductsData.map((product) => (
                <div
                  onClick={(e) => handleProductClick(product, e)}
                  key={product.id}
                  className="group flex-shrink-0 relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 w-56 flex flex-col"
                >
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={product.image_link || product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5YzlkYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjM1ZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                        e.target.style.objectFit = 'contain';
                      }}
                    />

                    {/* Recommended badge */}
                    <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Star className={`h-3 w-3 fill-current ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t('recommended')}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className={`text-gray-900 font-semibold text-sm line-clamp-2 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {product.name}
                    </h3>
                    <p className={`text-gray-600 text-xs line-clamp-2 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {product.description && product.description !== "null"
                        ? product.description
                        : t('deliciousFoodItem')}
                    </p>
                    <div className={`mt-auto flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-mainColor font-bold text-lg">
                        {product.price_after_discount || product.price} {t('egp')}
                      </span>
                      {product.price_after_discount && product.price_after_discount < product.price && (
                        <span className="text-gray-500 text-sm line-through">
                          {product.price} {t('egp')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Dialog */}
      {showProductDialog && selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={handleCloseDialog}
          language={selectedLanguage}
        />
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default RecommendedProduct;