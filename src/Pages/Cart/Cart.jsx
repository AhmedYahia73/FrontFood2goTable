import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Minus, Plus, X, ShoppingCart, Trash2, Receipt } from 'lucide-react';
import {
  incrementQuantity,
  decrementQuantity,
  clearCart,
  setServiceFees,
  removeFromCart
} from '../../Store/Slices/cartSlice';
import { usePost } from '../../Hooks/usePost';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../Context/Auth';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const { items, subtotal, netSubtotal, total, itemCount, totalDiscount, totalTax, totalTaxIncluded, totalTaxExcluded, priceAfterDiscount, serviceFees } = useSelector(state => state.cart);
  const tableId = useSelector(state => state.table?.data);
  const taxSysType = useSelector(state => state.taxType?.data || 'included');
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const { t } = useTranslation();
  const [locationStatus, setLocationStatus] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const { postData: postOrder, loading: loadingPostOrder, response: orderResponse, error: orderError } = usePost({
    url: `${import.meta.env.VITE_API_BASE_URL}/client/order/dine_in_order`,
  });
  const auth = useAuth();

  const cart = useSelector(state => state.cart);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    netSubtotal: 0,
    discount: 0,
    priceAfterDiscount: 0,
    tax: 0,
    taxIncluded: 0,
    taxExcluded: 0,
    delivery: 0,
    total: 0,
    paymentFee: 0,
    serviceFees: 0
  });

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      auth.toastError(t('Geolocation is not supported by your browser.'));
      return;
    }

    setLocationStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        setLocationStatus('success');
      },
      (error) => {
        let errorMsg = 'Error getting location: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += 'User denied the request for location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg += 'Location request timed out.';
            break;
          default:
            errorMsg += 'An unknown error occurred.';
            break;
        }
        setLocationStatus('error');
        auth.toastError(t(errorMsg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Request location on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Check if any item has excluded tax
  const hasExcludedTax = items.some(item => {
    const taxSetting = item.product.taxes?.setting || item.product.tax_obj?.setting || 'excluded';
    return taxSetting === 'excluded';
  });

  useEffect(() => {
    // Calculate order summary from cart
    if (cart.items.length > 0) {
      setOrderSummary({
        subtotal: cart.subtotal,
        netSubtotal: cart.netSubtotal,
        discount: cart.totalDiscount,
        priceAfterDiscount: cart.priceAfterDiscount,
        tax: cart.totalTax,
        taxIncluded: cart.totalTaxIncluded,
        taxExcluded: cart.totalTaxExcluded,
        total: cart.total,
      });
    }
  }, [cart, taxSysType]);

  const prepareOrderData = () => {
    // total from Redux is now accurate for both included and excluded taxes
    let totalAmount = orderSummary.total;

    // Add service fees
    totalAmount += (orderSummary.serviceFees || 0);

    const products = cart.items.map(item => ({
      product_id: item.product.id,
      note: item.note,
      count: item.quantity,
      addons: Object.entries(item.addons)
        .filter(([_, addonData]) => addonData.checked)
        .map(([addonId, addonData]) => ({
          addon_id: parseInt(addonId),
          count: addonData.quantity || 1
        })),
      exclude_id: item.excludes,
      extra_id: Object.entries(item.extras)
        .filter(([_, quantity]) => quantity > 0)
        .map(([extraId]) => parseInt(extraId)),
      variation: Object.entries(item.variations).map(([variationId, optionIds]) => ({
        variation_id: parseInt(variationId),
        option_id: Array.isArray(optionIds) ? optionIds : [optionIds]
      }))
    }));

    return {
      notes: notes,
      amount: totalAmount,
      total_tax: cart.totalTax,
      total_discount: cart.totalDiscount,
      products: products,
      source: "web",
      confirm_order: 0,
      table_id: tableId,
      lat: lat,
      lng: lng,
    };
  };

  const handleOrder = () => {
    if (items.length === 0) {
      auth.toastError(t('Your cart is empty'));
    } else if (!tableId) {
      auth.toastError(t('Table ID not found. Please scan QR code first.'));
      navigate('/qr_scan', { replace: true });
    } else {
      setShowConfirmDialog(true);
    }
  };

  const onConfirmOrder = () => {
    postOrder(prepareOrderData());
    setShowConfirmDialog(false);
  };

  useEffect(() => {
    if (orderResponse && !loadingPostOrder && orderResponse.status === 200) {
      auth.toastSuccess(t('order placed successfully!'));
      dispatch(clearCart());
      navigate('/', { replace: true });
    } else if (orderError) {
      auth.toastError(t(orderError.message || 'Failed to place order. Please try again.'));
    }
  }, [orderResponse, orderError, auth, t, dispatch]);

  
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-96">
        <ShoppingCart className="w-24 h-24 mb-6 text-gray-300" />
        <h3 className="mb-2 text-xl font-semibold text-gray-600">{t("YourCartIsEmpty")}</h3>
        <p className="mb-6 text-gray-500">{t("AddSomeDeliciousItemsToGetStarted")}</p>

        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 text-white transition-colors rounded-lg bg-mainColor hover:bg-mainColor/90"
        >
          {t("ContinueShopping")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 xl:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-mainColor">{t("ShoppingCart")}</h1>

          <p className="mt-1 text-gray-600">
            {itemCount} {itemCount === 1 ? t("Item") : t("Items")} {t("InYourCart")}
          </p>

        </div>
        <button
          onClick={() => dispatch(clearCart())}
          className="flex items-center gap-2 px-4 py-2 font-medium text-red-500 transition-colors rounded-lg hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          {t("ClearCart")}
        </button>
      </div>


      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="p-4 transition-shadow bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md md:p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-24 h-24 overflow-hidden bg-gray-50 rounded-xl md:w-32 md:h-32">
                    <img
                      src={item.product.image_link}
                      alt={item.product.name}
                      className="block object-contain w-full h-full"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col justify-between flex-grow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                          {item.product.name}
                        </h3>
                        {/* Selected Options Summary */}
                        <div className="mt-1 space-y-1 text-sm text-gray-500">
                          {Object.keys(item.variations || {}).length > 0 && (
                            <div className="flex">
                              <span className="w-20 font-medium">{t("Variations")}:</span>
                              <span>
                                {Object.values(item.variations).map(optionIds => {
                                  const options = Array.isArray(optionIds) ? optionIds : [optionIds];
                                  return options.map(optVal => {
                                    if (!optVal) return null;
                                    const optId = typeof optVal === 'object' ? optVal.optionId : optVal;
                                    const option = item.product.variations?.flatMap(v => v.options)?.find(o => String(o.id) === String(optId));
                                    return option?.name;
                                  }).filter(Boolean).join(', ');
                                }).filter(Boolean).join(' | ')}
                              </span>
                            </div>
                          )}

                          {Object.keys(item.addons || {}).some(id => item.addons[id].checked) && (
                            <div className="flex">
                              <span className="w-20 font-medium">{t("Addons")}:</span>
                              <span>
                                {Object.entries(item.addons)
                                  .filter(([_, data]) => data.checked)
                                  .map(([id, data]) => {
                                    const addon = item.product.addons?.find(a => String(a.id) === String(id));
                                    return `${addon?.name} (${data.quantity})`;
                                  }).join(', ')}
                              </span>
                            </div>
                          )}

                          {Object.keys(item.extras || {}).some(id => item.extras[id] > 0) && (
                            <div className="flex">
                              <span className="w-20 font-medium">{t("Extras")}:</span>
                              <span>
                                {Object.entries(item.extras)
                                  .filter(([_, qty]) => qty > 0)
                                  .map(([id, qty]) => {
                                    const extra = [...(item.product.allExtras || []), ...(item.product.addons || [])]?.find(e => String(e.id) === String(id));
                                    return `${extra?.name} (${qty})`;
                                  }).join(', ')}
                              </span>
                            </div>
                          )}

                          {item.excludes && item.excludes.length > 0 && (
                            <div className="flex">
                              <span className="w-20 font-medium">{t("Excluded")}:</span>
                              <span>
                                {item.excludes.map(excludeId => {
                                  const exclude = item.product.excludes?.find(e => e.id === excludeId);
                                  return exclude?.name;
                                }).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="ml-4 text-gray-400 transition-colors hover:text-red-500"
                        title="Remove item"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center px-3 py-1 space-x-3 rounded-lg bg-gray-50">
                        <button
                          onClick={() => dispatch(decrementQuantity(item.id))}
                          className="p-1 transition-colors rounded-full hover:bg-white"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-lg font-semibold text-center">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(incrementQuantity(item.id))}
                          className="p-1 transition-colors rounded-full hover:bg-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <span className="text-xl font-bold text-mainColor">
                        {item.totalPrice.toFixed(2)} {t("egp")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky p-6 bg-white border border-gray-100 shadow-md rounded-xl top-4">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-gray-900">
              <Receipt className="w-5 h-5" />
              {t("OrderSummary")}            </h2>

            {/* Order Note */}
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t("specialInstructions")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("addSpecialInstructions")}
                className="w-full p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-mainColor/20 focus:border-mainColor"
                rows={3}
              />
            </div>

            {/* Price Breakdown */}
            <div className="mb-6 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>{t("Subtotal")} ({itemCount} {t("items")})</span>
                <span>{netSubtotal.toFixed(2)} {t("egp")}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t("Discount")}</span>
                  <span>-{totalDiscount.toFixed(2)} {t("egp")}</span>
                </div>
              )}

              {totalTaxIncluded > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>{t("TaxIncluded")}</span>
                  <span>{totalTaxIncluded.toFixed(2)} {t("egp")}</span>
                </div>
              )}

              {totalTaxExcluded > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>{t("TaxExcluded")}</span>
                  <span>+{totalTaxExcluded.toFixed(2)} {t("egp")}</span>
                </div>
              )}

              <div className="pt-3 border-t">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>{t("Total")}</span>
                  <span>{total.toFixed(2)} {t("egp")}</span>
                </div>
              </div>
            </div>


            {/* Tax Breakdown Modal Trigger */}
            {hasExcludedTax && taxSysType !== "included" && (
              <div className="p-3 mb-4 rounded-lg bg-gray-50">
                <details className="text-sm">
                  <summary className="font-medium text-gray-700 cursor-pointer">{t('ViewTaxBreakdown')}</summary>
                  <div className="mt-2 space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="text-xs text-gray-600">
                        <div className="font-medium">{item.product.name}</div>
                        {item.taxDetails.taxBreakdown.map((taxItem, taxIndex) => (
                          <div key={taxIndex} className="ml-2">
                            {taxItem.name}: {taxItem.taxAmount.toFixed(2)} {t("egp")} ({taxItem.taxRate}%) {taxItem.isTaxIncluded ? `(${t('Included')})` : ''}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Checkout Button */}
            <button onClick={() => handleOrder()} className="w-full py-3 text-lg font-bold text-white transition-colors rounded-lg bg-mainColor hover:bg-mainColor/90">
              {t("PlaceOrder")}            </button>

            {/* Continue Shopping */}
            <button
              onClick={() => window.history.back()}
              className="w-full py-3 mt-3 font-medium transition-colors border rounded-lg border-mainColor text-mainColor hover:bg-mainColor/5"
            >
              {t("ContinueShopping")}            </button>
          </div>
        </div>
      </div>
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>

            <h2 className="mb-2 text-2xl font-bold text-center text-gray-900">{t("OrderConfirmation")}</h2>
            <p className="mb-6 text-center text-gray-600">
              {t("AreYouSureYouWantToPlaceThisOrderForTable")} <span className="font-bold text-mainColor">{tableId}</span>?
            </p>

            <div className="p-4 mb-6 space-y-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("TotalItems")}:</span>
                <span className="font-semibold">{itemCount}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                <span>{t("TotalAmount")}:</span>
                <span className="text-mainColor">
                  {total.toFixed(2)} {t("egp")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-6 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                {t("Cancel")}
              </button>
              <button
                onClick={onConfirmOrder}
                className="flex-1 px-6 py-3 font-semibold text-white transition-all bg-mainColor rounded-xl hover:bg-mainColor/90 shadow-lg shadow-mainColor/20 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {t("Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;