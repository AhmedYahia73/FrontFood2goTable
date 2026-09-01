import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Heart } from 'lucide-react';
import { useGet } from '../../Hooks/useGet';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../Store/Slices/cartSlice';
import StaticSpinner from '../../Components/Spinners/StaticSpinner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../Context/Auth';
import { useNavigate } from 'react-router-dom';

const ProductDetails = ({ product, onClose, language, showActions = true }) => {
  const { t } = useTranslation();
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useAuth();
  const tableId = useSelector(state => state.table?.data) || localStorage.getItem('table_id');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [selectedAddons, setSelectedAddons] = useState({});
  const [selectedExcludes, setSelectedExcludes] = useState([]);
  const [selectedExtras, setSelectedExtras] = useState({});
  const [note, setNote] = useState('');
  const [displayProduct, setDisplayProduct] = useState(product);
  const selectedLanguage = useSelector(state => state.language?.selected || 'en');
  const restaurantOpen = useSelector((state) => state.categories?.open ?? true);
  const restaurantCloseMessage = useSelector((state) => state.categories?.closeMessage || '');

  let productDetailsUrl = `${apiUrl}/customer/home/product_item_web/${product.id}?locale=${language}`;

  if (tableId) {
    productDetailsUrl += `&table_id=${tableId}`;
  }

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

  // Update product data
  useEffect(() => {
    if (productDetails && !loadingProductDetails) {
      setDisplayProduct(productDetails.product || product);

      const initialAddons = {};
      // FIX: Convert addons object to array before using forEach
      const addonsArray = Object.values(productDetails.addons || {});
      addonsArray.forEach((addon) => {
        initialAddons[addon.id] = {
          checked: false,
          quantity: addon.quantity_add === 1 ? 1 : 1,
        };
      });
      setSelectedAddons(initialAddons);

      const initialExtras = {};
      // Apply the same fix to allExtras if needed
      const extrasArray = Object.values(productDetails.allExtras || {});
      extrasArray.forEach((extra) => {
        initialExtras[extra.id] = 0;
      });
      setSelectedExtras(initialExtras);

      if (productDetails.variations) {
        const initialVars = {};
        productDetails.variations.forEach((v) => {
          const isReq = v.required === 1 || v.required === true || v.required === "1" || v.required === "true";
          if (isReq && v.type === 'single' && v.options && v.options.length > 0) {
            initialVars[v.id] = v.options[0].id;
          }
        });
        setSelectedVariations((prev) => ({ ...initialVars, ...prev }));
      }
    }
  }, [productDetails, product, loadingProductDetails, dispatch]);

  // Helper to remove only one instance of an ID from an array
  const handleVariationDecrement = (variationId, optionId) => {
    setSelectedVariations((prev) => {
      const current = prev[variationId] || prev[String(variationId)] || [];
      const index = current.findIndex(id => String(id) === String(optionId));
      if (index > -1) {
        const newArr = [...current];
        newArr.splice(index, 1); // Removes only the first occurrence found
        return { ...prev, [variationId]: newArr };
      }
      return prev;
    });
  };

  const handleVariationChange = (variationId, optionId, type, max) => {
    if (type === 'single') {
      setSelectedVariations((prev) => {
        const currentVal = prev[variationId] ?? prev[String(variationId)];
        if (currentVal !== undefined && String(currentVal) === String(optionId)) {
          const { [variationId]: _, [String(variationId)]: __, ...rest } = prev;
          return rest;
        }
        return { ...prev, [variationId]: optionId };
      });
    } else {
      // Multiple selection (Increment logic)
      setSelectedVariations((prev) => {
        const current = prev[variationId] || prev[String(variationId)] || [];
        // Check if we can still add more items based on variation.max
        if (max && current.length >= max) return prev;

        return { ...prev, [variationId]: [...current, optionId] };
      });
    }
  };

  // const handleVariationChange = (variationId, optionId, type) => {
  //   if (type === 'single') {
  //     setSelectedVariations((prev) => {
  //       // Click same → deselect
  //       if (prev[variationId] === optionId) {
  //         const { [variationId]: _, ...rest } = prev;
  //         return rest;
  //       }
  //       // Click different → select new
  //       return { ...prev, [variationId]: optionId };
  //     });
  //   } else {
  //     // Multiple selection (checkbox behavior)
  //     setSelectedVariations((prev) => {
  //       const current = prev[variationId] || [];
  //       if (current.includes(optionId)) {
  //         return { ...prev, [variationId]: current.filter(id => id !== optionId) };
  //       } else {
  //         return { ...prev, [variationId]: [...current, optionId] };
  //       }
  //     });
  //   }
  // };

  const handleAddonChange = (addonId, checked) => {
    setSelectedAddons((prev) => ({
      ...prev,
      [addonId]: {
        ...prev[addonId],
        checked,
        quantity: checked && productDetails?.addons?.find((a) => a.id === addonId)?.quantity_add === 0 ? 1 : prev[addonId]?.quantity || 1,
      },
    }));
  };

  const handleAddonQuantityChange = (addonId, newQuantity) => {
    const addon = productDetails?.addons?.find((a) => a.id === addonId);
    if (addon?.quantity_add === 1) {
      setSelectedAddons((prev) => ({
        ...prev,
        [addonId]: { ...prev[addonId], quantity: Math.max(1, newQuantity) },
      }));
    }
  };

  const handleExcludeChange = (excludeId, checked) => {
    if (checked) {
      setSelectedExcludes((prev) => [...prev, excludeId]);
    } else {
      setSelectedExcludes((prev) => prev.filter((id) => id !== excludeId));
    }
  };

  const handleExtraQuantityChange = (extraId, newQuantity) => {
    const extra = productDetails?.allExtras?.find((e) => String(e.id) === String(extraId));
    if (extra && isExtraAvailable(extra)) {
      const min = extra.min || 0;
      const max = extra.max || Infinity;
      const clampedQuantity = Math.max(min, Math.min(max, newQuantity));
      setSelectedExtras((prev) => ({
        ...prev,
        [extraId]: clampedQuantity,
      }));
    }
  };

  const isExtraAvailable = (extra) => {
    if (!extra.variation_id && !extra.option_id) return true;
    if (extra.variation_id && extra.option_id) {
      const selectedOptions = selectedVariations[extra.variation_id];
      if (Array.isArray(selectedOptions)) {
        return selectedOptions.some(id => String(id) === String(extra.option_id));
      } else {
        const optId = typeof selectedOptions === 'object' ? selectedOptions.optionId : selectedOptions;
        return String(optId) === String(extra.option_id);
      }
    }
    if (extra.variation_id && !extra.option_id) {
      const selectedOptions = selectedVariations[extra.variation_id];
      return selectedOptions && (Array.isArray(selectedOptions) ? selectedOptions.length > 0 : true);
    }
    return false;
  };

  const getAvailableExtras = () => {
    if (!productDetails?.allExtras) return [];
    return productDetails.allExtras.filter((extra) => isExtraAvailable(extra));
  };

  const baseEntity = productDetails || product;
  const isIncludedStr = (val) => typeof val === 'string' && val.toLowerCase() === 'included';
  const isTaxIncluded = 
    isIncludedStr(baseEntity?.taxes) || 
    isIncludedStr(baseEntity?.taxes?.setting) || 
    isIncludedStr(baseEntity?.tax_obj?.setting) ||
    isIncludedStr(baseEntity?.tax?.setting) ||
    isIncludedStr(baseEntity?.tax_type) ||
    isIncludedStr(baseEntity?.tax_setting) ||
    (parseFloat(baseEntity?.tax_val) > 0 && Math.abs(parseFloat(baseEntity?.price_after_tax || 0) - parseFloat(baseEntity?.price_after_discount || baseEntity?.after_disount || baseEntity?.final_price || 0)) < 0.01);

  const getDisplayPrice = (entity) => {
    if (isTaxIncluded) {
      return parseFloat(entity?.final_price || entity?.price_after_tax || entity?.price_after_discount || entity?.price || 0);
    }
    return parseFloat(entity?.price_after_discount || entity?.price || entity?.final_price || 0);
  };

  const calculateTotalPrice = () => {
    if (!productDetails) return getDisplayPrice(product) * quantity;

    let baseUnitPrice = getDisplayPrice(productDetails);
    let variationPrice = 0;

    // Add variation prices
    Object.values(selectedVariations).forEach((optionIds) => {
      if (Array.isArray(optionIds)) {
        optionIds.forEach((optionId) => {
          const option = productDetails.variations
            ?.flatMap((v) => v.options)
            ?.find((o) => String(o.id) === String(optionId));
          if (option) variationPrice += getDisplayPrice(option);
        });
      } else if (optionIds) {
        const optionId = typeof optionIds === 'object' ? optionIds.optionId : optionIds;
        const weightMultiplier = (typeof optionIds === 'object' && optionIds.value) ? parseFloat(optionIds.value) : 1;
        const option = productDetails.variations
          ?.flatMap((v) => v.options)
          ?.find((o) => String(o.id) === String(optionId));
        if (option) variationPrice += getDisplayPrice(option) * weightMultiplier;
      }
    });

    let total = (baseUnitPrice + variationPrice) * quantity;

    // Add addon prices
    Object.entries(selectedAddons).forEach(([addonId, addonData]) => {
      if (addonData && addonData.checked) {
        const addon = productDetails.addons?.find((a) => String(a.id) === String(addonId));
        if (addon) {
          const addonQty = addonData.quantity || 1;
          total += getDisplayPrice(addon) * addonQty;
        }
      }
    });

    // Add extra prices
    Object.entries(selectedExtras).forEach(([extraId, extraQty]) => {
      const extra = [...(productDetails.allExtras || []), ...(productDetails.addons || [])]?.find((e) => String(e.id) === String(extraId));
      if (extra && extraQty > 0 && isExtraAvailable(extra)) {
        total += getDisplayPrice(extra) * extraQty * quantity;
      }
    });

    return total;
  };

  const calculateTotalTax = () => {
    if (!productDetails) return 0;
    
    // Product tax
    let productTax = parseFloat(productDetails.tax_val || productDetails.tax_only || 0);
    const productTaxObj = productDetails.tax_obj || productDetails.tax || productDetails.taxes;
    if (productTax === 0 && productTaxObj && productTaxObj.amount) {
      const taxRate = parseFloat(productTaxObj.amount || 0);
      const basePrice = parseFloat(productDetails.price || productDetails.price_after_discount || 0);
      productTax = productTaxObj.type === 'precentage' ? (basePrice * taxRate) / 100 : taxRate;
    }
    let totalTax = productTax * quantity;

    // Variations tax
    Object.values(selectedVariations).forEach((optionIds) => {
      if (Array.isArray(optionIds)) {
        optionIds.forEach((optionId) => {
          const option = productDetails.variations
            ?.flatMap((v) => v.options)
            ?.find((o) => String(o.id) === String(optionId));
          if (option) {
            let optTax = parseFloat(option.tax_val || option.tax_only || 0);
            const optTaxObj = option.taxes || option.tax || productTaxObj;
            if (optTax === 0 && optTaxObj && optTaxObj.amount) {
              const rate = parseFloat(optTaxObj.amount || 0);
              const optPrice = parseFloat(option.price || 0);
              optTax = optTaxObj.type === 'precentage' ? (optPrice * rate) / 100 : rate;
            }
            totalTax += optTax * quantity;
          }
        });
      } else if (optionIds) {
        const optionId = typeof optionIds === 'object' ? optionIds.optionId : optionIds;
        const weightMultiplier = (typeof optionIds === 'object' && optionIds.value) ? parseFloat(optionIds.value) : 1;
        const option = productDetails.variations
          ?.flatMap((v) => v.options)
          ?.find((o) => String(o.id) === String(optionId));
        if (option) {
          let optTax = parseFloat(option.tax_val || option.tax_only || 0);
          const optTaxObj = option.taxes || option.tax || productTaxObj;
          if (optTax === 0 && optTaxObj && optTaxObj.amount) {
            const rate = parseFloat(optTaxObj.amount || 0);
            const optPrice = parseFloat(option.price || 0);
            optTax = optTaxObj.type === 'precentage' ? (optPrice * rate) / 100 : rate;
          }
          totalTax += optTax * weightMultiplier * quantity;
        }
      }
    });

    // Addons tax
    Object.entries(selectedAddons).forEach(([addonId, addonData]) => {
      if (addonData && addonData.checked) {
        const addon = productDetails.addons?.find((a) => String(a.id) === String(addonId));
        if (addon) {
          const addonQty = addonData.quantity || 1;
          let aTax = parseFloat(addon.tax_val || addon.tax_only || 0);
          const addonTaxObj = addon.tax || addon.taxes || productTaxObj;
          if (aTax === 0 && addonTaxObj && addonTaxObj.amount) {
            const rate = parseFloat(addonTaxObj.amount || 0);
            const aPrice = parseFloat(addon.price || 0);
            aTax = addonTaxObj.type === 'precentage' ? (aPrice * rate) / 100 : rate;
          }
          totalTax += aTax * addonQty;
        }
      }
    });

    // Extras tax
    Object.entries(selectedExtras).forEach(([extraId, extraQty]) => {
      const extra = [...(productDetails.allExtras || []), ...(productDetails.addons || [])]?.find((e) => String(e.id) === String(extraId));
      if (extra && extraQty > 0 && isExtraAvailable(extra)) {
        let eTax = parseFloat(extra.tax_val || extra.tax_only || 0);
        if (eTax === 0 && extra.final_price && extra.price && extra.final_price > extra.price) {
          eTax = parseFloat(extra.final_price) - parseFloat(extra.price);
        }
        const extraTaxObj = extra.tax || extra.taxes || productTaxObj;
        if (eTax === 0 && extraTaxObj && extraTaxObj.amount) {
          const rate = parseFloat(extraTaxObj.amount || 0);
          const ePrice = parseFloat(extra.price || 0);
          eTax = extraTaxObj.type === 'precentage' ? (ePrice * rate) / 100 : rate;
        }
        totalTax += eTax * extraQty * quantity;
      }
    });

    return totalTax;
  };

  const validateVariationSelection = (variation) => {
    const isRequired = variation.required === 1 || variation.required === true || variation.required === "1" || variation.required === "true";
    if (!isRequired) return true;
    const selectedOptions = selectedVariations[variation.id] ?? selectedVariations[String(variation.id)];
    if (selectedOptions === undefined || selectedOptions === null || selectedOptions === '') return false;
    if (variation.type === 'single') {
      return !!selectedOptions;
    } else {
      const selectedCount = Array.isArray(selectedOptions) ? selectedOptions.length : (selectedOptions ? 1 : 0);
      if (variation.min !== null && variation.min !== undefined && selectedCount < variation.min) return false;
      if (variation.max !== null && variation.max !== undefined && selectedCount > variation.max) return false;
      return selectedCount > 0;
    }
  };

  const validateExtrasSelection = () => {
    const availableExtras = getAvailableExtras();
    if (!availableExtras.length) return true;
    return availableExtras.every((extra) => {
      const extraId = extra.id;
      const quantity = selectedExtras[extraId] ?? selectedExtras[String(extraId)] ?? 0;
      if (quantity === 0) {
        return !extra.required;
      }
      if (extra.min !== null && extra.min !== undefined && quantity < extra.min) return false;
      if (extra.max !== null && extra.max !== undefined && quantity > extra.max) return false;
      return true;
    });
  };

  const canAddToCart = () => {
    if (!productDetails) return true;
    const variationsValid = productDetails.variations?.every(validateVariationSelection) ?? true;
    const extrasValid = validateExtrasSelection();
    return variationsValid && extrasValid;
  };

  const handleAddToCart = () => {
    if (!canAddToCart()) return;

    if (!tableId) {
      onClose();
      auth.toastError(t('PleaseScanQrCodeToOrder'));
      setTimeout(() => navigate("/qr_scan"), 1500);
      return;
    }

    // Check if restaurant is closed (only after branch/address is selected)
    if (restaurantOpen == false) {
      auth.toastError(`${restaurantCloseMessage ? `\n ${restaurantCloseMessage}` : ''}`);
      return;
    }

    const cartItem = {
      product: productDetails || product,
      quantity,
      variations: selectedVariations,
      addons: selectedAddons,
      excludes: selectedExcludes,
      extras: selectedExtras,
      note: note.trim(),
      totalPrice: calculateTotalPrice(),
    };
    dispatch(addToCart(cartItem));
    auth.toastSuccess(`${product.name} ${t('addedToCart')}`);
    onClose();
  };

  if (loadingProductDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="p-8 bg-white rounded-lg">
          <StaticSpinner />
        </div>
      </div>
    );
  }

  const displayData = productDetails || product;
  const availableExtras = getAvailableExtras();
  const taxSetting = isTaxIncluded ? 'included' : 'excluded';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-[100] flex items-center justify-between p-4 bg-white border-b shadow-sm">
          <h2 className="text-xl font-bold text-mainColor truncate pr-4">
            {displayData.name}
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="p-2 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                  {getDisplayPrice(displayData)} {t('egp')}
                </span>
              </div>
            </div>
            {taxSetting === 'included' && displayData.tax_val > 0 && (
              <div className="mt-1 text-sm text-gray-600">
                {t('taxIncluded')}: {displayData.tax_val} {t('egp')}
              </div>
            )}
            {taxSetting === 'excluded' && displayData.tax_val > 0 && (
              <div className="mt-1 text-sm text-gray-600">
                {t('TaxExcluded')}: +{displayData.tax_val} {t('egp')}
              </div>
            )}
          </div>
          {/* Variations */}
          {displayData.variations?.map((variation) => (
            <div key={variation.id} className="mb-6">
              <h3 className="mb-3 font-semibold">
                {variation.name} {variation.required ? <span className="text-red-500">*</span> : '(optional)'}
                {variation.type === 'multiple' && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({t('select')} {variation.min || 0}-{variation.max || '∞'})
                  </span>
                )}
              </h3>

              <div className="space-y-2">
                {variation.options.map((option) => {
                  const currentSelections = selectedVariations[variation.id] ?? selectedVariations[String(variation.id)];
                  const optionCount = variation.type === 'single'
                    ? (currentSelections !== undefined && currentSelections !== null && String(currentSelections) === String(option.id) ? 1 : 0)
                    : (Array.isArray(currentSelections) ? currentSelections.filter(id => String(id) === String(option.id)).length : 0);

                  const isSelected = optionCount > 0;
                  const totalSelectedInCategory = Array.isArray(currentSelections) ? currentSelections.length : (isSelected ? 1 : 0);
                  const isAtMax = variation.type === 'multiple' && variation.max && totalSelectedInCategory >= variation.max;

                  return (
                    <div
                      key={option.id}
                      // 1. Move onClick to the parent DIV
                      onClick={() => {
                        if (isAtMax && variation.type === 'multiple') return;
                        handleVariationChange(variation.id, option.id, variation.type, variation.max);
                      }}
                      // 2. Add cursor-pointer
                      className={`flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer ${isSelected ? 'border-mainColor bg-mainColor/5' : 'border-gray-200'
                        } ${isAtMax && variation.type === 'multiple' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isSelected ? 'font-medium' : ''}>{option.name}</span>
                        {getDisplayPrice(option) > 0 && (
                          <span className="text-sm font-semibold text-mainColor">
                            +{getDisplayPrice(option)} {t('egp')}
                          </span>
                        )}
                      </div>

                      {variation.type === 'single' ? (
                        // For single, we just show the radio circle (no separate onClick needed here)
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center 
          ${isSelected ? 'border-mainColor bg-mainColor' : 'border-gray-300'}`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {optionCount > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // 3. IMPORTANT: Stop click from triggering parent div (plus logic)
                                handleVariationDecrement(variation.id, option.id);
                              }}
                              className="p-1 border border-mainColor text-mainColor rounded-full hover:bg-mainColor hover:text-whiteColor transition-colors z-10"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          )}

                          {optionCount > 0 && <span className="font-bold text-sm min-w-[15px] text-center">{optionCount}</span>}

                          {/* Plus icon (visual only, since parent div handles the add) */}
                          <div className={`p-1 rounded-full transition-colors ${isAtMax ? 'bg-gray-100 text-gray-400' : 'bg-mainColor text-whiteColor'
                            }`}>
                            <Plus className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Validation Warning */}
              {variation.required && variation.type === 'multiple' ? (
                (() => {
                  const count = (selectedVariations[variation.id] || []).length;
                  if (variation.min > 0 && count < variation.min) {
                    return <p className="text-sm text-red-500 mt-2">{t('selectAtLeast')} {variation.min}</p>;
                  }
                  return null;
                })()
              ) : ''}
            </div>
          ))}
          {/* Addons */}
          {displayData.addons?.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold">{t('addons')}</h3>
              <div className="space-y-2">
                {displayData.addons.map((addon) => {
                  const canChangeQuantity = addon.quantity_add === 1;
                  const currentAddon = selectedAddons[addon.id];
                  return (
                    <div key={addon.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!currentAddon?.checked}
                            onChange={(e) => handleAddonChange(addon.id, e.target.checked)}
                            className={`${selectedLanguage === "en" ? 'mr-3' : 'ml-3'}`}
                          />
                          <span>{addon.name}</span>
                        </div>
                        <span className="font-semibold text-mainColor">
                          +{getDisplayPrice(addon)} {t('egp')}
                        </span>
                      </label>
                      {currentAddon?.checked && (
                        <div className="flex items-center justify-end gap-2 pl-6 mt-2">
                          {canChangeQuantity ? (
                            <>
                              <span className="text-sm text-gray-600">{t('quantity')}:</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleAddonQuantityChange(addon.id, currentAddon.quantity - 1)}
                                  className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
                                  disabled={currentAddon.quantity <= 1}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-sm font-semibold text-center">
                                  {currentAddon.quantity}
                                </span>
                                <button
                                  onClick={() => handleAddonQuantityChange(addon.id, currentAddon.quantity + 1)}
                                  className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-600">{t('quantityFixed')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Extras */}
          {availableExtras.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold">{t('availableExtras')}</h3>
              <div className="space-y-3">
                {availableExtras.map((extra) => {
                  const currentQty = selectedExtras[extra.id] || 0;
                  const min = extra.min || 0;
                  const max = extra.max || Infinity;
                  const hasDiscount = extra.price_after_discount && extra.price_after_discount < extra.price;

                  return (
                    <div key={extra.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{extra.name}</span>
                        <div className="flex items-center gap-2">
                          {hasDiscount && (
                            <span className="text-sm text-red-500 line-through">
                              {extra.price} {t('egp')}
                            </span>
                          )}
                          <span className="font-semibold text-mainColor">
                            +{getDisplayPrice(extra)} {t('egp')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {min > 0 && `${t('min')}: ${min}, `}
                          {t('max')}: {max === Infinity ? t('noLimit') : max}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleExtraQuantityChange(extra.id, currentQty - 1)}
                            className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
                            disabled={currentQty <= min}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-sm font-semibold text-center">
                            {currentQty}
                          </span>
                          <button
                            onClick={() => handleExtraQuantityChange(extra.id, currentQty + 1)}
                            className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
                            disabled={currentQty >= max}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Excludes */}
          {displayData.excludes?.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold">{t('excludeItems')}</h3>
              <div className="space-y-2">
                {displayData.excludes.map((exclude) => (
                  <label
                    key={exclude.id}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedExcludes.includes(exclude.id)}
                      onChange={(e) => handleExcludeChange(exclude.id, e.target.checked)}
                      className={`${selectedLanguage === "en" ? 'mr-3' : 'ml-3'}`}
                    />
                    <span>{exclude.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {/* Note Input */}
          <div className="mb-6">
            <h3 className="mb-3 font-semibold">{t('specialInstructions')}</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('addSpecialInstructions')}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-mainColor"
              rows={3}
              maxLength={500}
            />
            <div className="mt-1 text-sm text-right text-gray-500">
              {note.length}/500 {t('characters')}
            </div>
          </div>
          {/* Quantity */}
          <div className="flex items-center justify-between mb-6">
            <span className="font-semibold">{t('quantity')}</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 font-semibold text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-1 border border-gray-300 rounded-full hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Total Price */}
          <div className="p-4 mb-6 rounded-lg bg-mainColor/10">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{t('totalPrice')}</span>
              <span className="text-2xl font-bold text-mainColor">
                {calculateTotalPrice().toFixed(2)} {t('egp')}
              </span>
            </div>
            {calculateTotalTax() > 0 && (
              <div className="flex items-center justify-between mt-1 text-xs text-gray-600 border-t border-mainColor/20 pt-1.5">
                <span>{t('price')}: {(calculateTotalPrice() - calculateTotalTax()).toFixed(2)} {t('egp')}</span>
                <span>{taxSetting === 'included' ? t('taxIncluded') : t('TaxExcluded')}: {calculateTotalTax().toFixed(2)} {t('egp')}</span>
              </div>
            )}
          </div>
          {/* Add to Cart Button */}
          {showActions && (
            <div className="sticky bottom-0 p-4 bg-white border-t mt-auto">
              {restaurantOpen == false ? (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed flex flex-col items-center justify-center leading-tight"
                >
                  <span>{t('restaurantIsClosedNow')}</span>
                  {restaurantCloseMessage && (
                    <span className="text-xs mt-1 font-normal">{restaurantCloseMessage}</span>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart()}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${canAddToCart()
                    ? 'bg-mainColor text-whiteColor hover:bg-mainColor/90'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {canAddToCart() ? t('addToCart') : t('completeSelection')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;