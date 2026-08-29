import React, { useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import ProductDetails from '../Pages/Products/ProductDetails';
import ProductDetailsViewOnly from '../Pages/Products/ProductDetailsViewOnly';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../Store/Slices/cartSlice';
import { useAuth } from '../Context/Auth';
import { useTranslation } from 'react-i18next';

const ProductCard = ({
  product,
  language = 'en',
  showActions = true // Default to true to maintain existing behavior
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const auth = useAuth();
  const restaurantOpen = useSelector((state) => state.categories?.open ?? true);
  const restaurantCloseMessage = useSelector((state) => state.categories?.closeMessage || '');
  const selectedAddressId = useSelector((state) => state.orderType?.selectedAddressId);
  const selectedBranchId = useSelector((state) => state.orderType?.selectedBranchId);

  // Card state
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Handle quick add to cart
  const handleQuickAddToCart = (e) => {
    e.stopPropagation();

    // Check if branch or address is selected
    if (!selectedBranchId && !selectedAddressId) {
      // If no location selected, open product details instead
      handleProductClick(e);
      return;
    }

    // Check if restaurant is closed
    if (restaurantOpen == false) {
      auth.toastError(`${t('restaurantIsClosedNow')} ${restaurantCloseMessage ? `\n ${restaurantCloseMessage}` : ''}`);
      return;
    }

    const cartItem = {
      product,
      quantity: 1,
      variations: {},
      addons: {},
      excludes: [],
      extras: {},
      note: '',
    };
    dispatch(addToCart(cartItem));
    auth.toastSuccess(`${product.name} ${t('addedToCart')}`);
  };

  // Handle open product details dialog
  const handleProductClick = (e) => {
    e.stopPropagation();

    // Check if restaurant is closed (only after branch/address is selected)
    if (restaurantOpen == false) {
      auth.toastError(`${t('restaurantIsClosedNow')} ${restaurantCloseMessage ? `\n ${restaurantCloseMessage}` : ''}`);
      return;
    }

    setSelectedProduct(product);
    setShowProductDialog(true);
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setShowProductDialog(false);
    setSelectedProduct(null);
  };

  return (
    <>
      {/* Product Card */}
      <div
        onClick={handleProductClick}
        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-row h-32 cursor-pointer relative group"
      >
        {/* Product Image */}
        <div className="w-32 flex-shrink-0 relative overflow-hidden">
          <img
            src={product.image_link}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        {/* Product Content */}
        <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
          <div className="overflow-hidden">
            <h3 className="font-semibold text-base mb-1 line-clamp-1 leading-tight">
              {product.name}
            </h3>
            <p className="text-gray-600 text-xs mb-2 line-clamp-2 leading-relaxed">
              {product.description === 'null' ? '' : product.description}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-mainColor font-bold text-sm">
                {product.price_after_discount || product.price} {t('egp')}
              </span>
              {product.discount > 0 && (
                <span className="text-red-500 text-xs line-through">
                  {product.price} {t('egp')}
                </span>
              )}
            </div>
            <button
              onClick={handleQuickAddToCart}
              disabled={restaurantOpen == false}
              className={`p-1.5 rounded-full transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md transform hover:scale-105 
                ${!showActions ? 'opacity-0 pointer-events-none' : ''} 
                ${restaurantOpen == false ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-mainColor text-whiteColor hover:bg-mainColor/90'}`}
              title={restaurantOpen == false ? t('restaurantIsClosedNow') : t('quickAddToCart')}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      {/* Product Details Dialog */}
      {showProductDialog && selectedProduct && (
        showActions ? (
          <ProductDetails
            product={selectedProduct}
            onClose={handleCloseDialog}
            language={language}
            showActions={true}
          />
        ) : (
          <ProductDetailsViewOnly
            product={selectedProduct}
            onClose={handleCloseDialog}
            language={language}
          />
        )
      )}
    </>
  );
};

export default ProductCard;