import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCategories, setRestaurantStatus } from './../../../Store/Slices/CategoriesSlice';
import StaticSpinner from '../../../Components/Spinners/StaticSpinner';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGet } from '../../../Hooks/useGet';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../Context/Auth';

const Categories = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const selectedLanguage = useSelector((state) => state.language?.selected ?? 'en');
  const { t } = useTranslation();
  const auth = useAuth();
  const isRTL = selectedLanguage === 'ar';
  const tableId = useSelector(state => state.table?.data) || localStorage.getItem('table_id');

  const [categoriesData, setCategoriesData] = useState(null);
  const dispatch = useDispatch();
  const scrollContainerRef = useRef(null);
  const autoScrollRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const {
    refetch: refetchCategories,
    loading: loadingCategories,
    data: dataCategories,
  } = useGet({
    url: `${apiUrl}/client/order/products/${tableId}?locale=${selectedLanguage}`,
  });

  // Refetch categories when language, order type, or location changes
  useEffect(() => {
    refetchCategories();
  }, [selectedLanguage, tableId, refetchCategories]);

  // Store the data in state and check restaurant status
  useEffect(() => {
    if (dataCategories && !loadingCategories) {
      setCategoriesData(dataCategories.categories);
      dispatch(setCategories(dataCategories?.categories || []));

      // Store restaurant open status and close message
      dispatch(setRestaurantStatus({
        open: dataCategories.open ?? true,
        closeMessage: dataCategories.close_message || ''
      }));

      // Show toast if restaurant is closed
      if (dataCategories.open == false && dataCategories.close_message) {
        auth.toastError(`${dataCategories.close_message}`);
      }
    }
  }, [dataCategories, dispatch, loadingCategories, auth]);

  // Auto-scroll functionality with RTL support
  useEffect(() => {
    if (!scrollContainerRef.current || !isPlaying) return;

    const scrollContainer = scrollContainerRef.current;
    const scrollWidth = scrollContainer.scrollWidth;
    const clientWidth = scrollContainer.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    // Don't auto-scroll if all items are visible
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
  }, [isPlaying, categoriesData, isRTL]);

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

  // Show loading if data is not available yet
  if (loadingCategories) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-mainColor mx-auto mb-4"></div>
      </div>
    );
  }

  if (!categoriesData || categoriesData.length === 0) {
    return (
      <div className="w-full py-16 text-center bg-gray-50">
        <p className="text-gray-500 text-lg">{t('noCategoriesAvailable')}</p>
      </div>
    );
  }

  return (
    <section
      className="w-full py-4 px-4 relative"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full md:px-8">
        {/* Section Header */}
        <div className={`flex justify-between items-center mb-8 `}>
          <div>
            <h2 className={`text-2xl md:text-3xl font-bold text-mainColor ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('categories')}
            </h2>
          </div>

          {/* Navigation Controls - Only show if multiple categories */}
          {categoriesData.length > 1 && (
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

        {/* Categories Swiper */}
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
              {categoriesData.map((category) => {
                const to = `/products/${category.id}?table_id=${tableId}`;

                return (
                  <Link
                    key={category.id}
                    to={to}
                    className="group flex-shrink-0 relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 w-40 h-48 flex flex-col"
                  >
                    <div className="relative w-full h-full overflow-hidden">
                      <img
                        src={category.image_link}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />

                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>

                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className={`text-white font-semibold text-lg text-center line-clamp-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Auto-scroll status indicator */}
          {categoriesData.length > 1 && (
            <div className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-1'} space-x-1 bg-black/70 text-white px-2 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity`}>
              <div className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span>
                {t('autoScroll')} {isPlaying ? t('on') : t('paused')}
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default Categories;