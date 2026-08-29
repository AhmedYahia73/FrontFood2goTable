// Store/Slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const serializedCart = localStorage.getItem('cart');
    if (serializedCart === null) {
      return {
        items: [],
        total: 0,
        itemCount: 0,
        subtotal: 0,
        totalDiscount: 0,
        totalTax: 0,
        priceAfterDiscount: 0,
        serviceFees: 0
      };
    }
    return JSON.parse(serializedCart);
  } catch (err) {
    return {
      items: [],
      total: 0,
      itemCount: 0,
      subtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      priceAfterDiscount: 0,
      serviceFees: 0
    };
  }
};

// Save cart to localStorage
const saveCartToStorage = (cart) => {
  try {
    const serializedCart = JSON.stringify(cart);
    localStorage.setItem('cart', serializedCart);
  } catch (err) {
    console.error('Failed to save cart to localStorage:', err);
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: loadCartFromStorage(),
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity, variations, addons, excludes, extras, note } = action.payload;

      const itemId = generateCartItemId(product.id, variations, addons, excludes, extras);

      const existingItem = state.items.find(item => item.id === itemId);

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.note = note || existingItem.note;
        existingItem.totalPrice = calculateItemTotal(existingItem);
      } else {
        const newItem = {
          id: itemId,
          product,
          quantity,
          variations: variations || {},
          addons: addons || {},
          excludes: excludes || [],
          extras: extras || {},
          note: note || '',
          totalPrice: 0,
          basePrice: product.price_after_discount || product.price,
          taxDetails: calculateItemTaxDetails(product, variations, addons, quantity) // Only product and addons
        };
        newItem.totalPrice = calculateItemTotal(newItem);
        state.items.push(newItem);
      }

      updateCartTotals(state);
      saveCartToStorage(state);
    },

    updateCartItem: (state, action) => {
      const { itemId, quantity, variations, addons, excludes, extras, note } = action.payload;

      const item = state.items.find(item => item.id === itemId);
      if (item) {
        if (quantity !== undefined) item.quantity = quantity;
        if (variations) item.variations = variations;
        if (addons) item.addons = addons;
        if (excludes) item.excludes = excludes;
        if (extras) item.extras = extras;
        if (note !== undefined) item.note = note;

        item.taxDetails = calculateItemTaxDetails(item.product, item.variations, item.addons, item.quantity);
        item.totalPrice = calculateItemTotal(item);
        updateCartTotals(state);
        saveCartToStorage(state);
      }
    },

    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      updateCartTotals(state);
      saveCartToStorage(state);
    },

    clearCart: (state) => {
      state.items = [];
      updateCartTotals(state);
      saveCartToStorage(state);
    },

    incrementQuantity: (state, action) => {
      const itemId = action.payload;
      const item = state.items.find(item => item.id === itemId);
      if (item) {
        item.quantity += 1;
        item.taxDetails = calculateItemTaxDetails(item.product, item.variations, item.addons, item.quantity);
        item.totalPrice = calculateItemTotal(item);
        updateCartTotals(state);
        saveCartToStorage(state);
      }
    },

    decrementQuantity: (state, action) => {
      const itemId = action.payload;
      const item = state.items.find(item => item.id === itemId);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        item.taxDetails = calculateItemTaxDetails(item.product, item.variations, item.addons, item.quantity);
        item.totalPrice = calculateItemTotal(item);
        updateCartTotals(state);
        saveCartToStorage(state);
      }
    },

    updateItemNote: (state, action) => {
      const { itemId, note } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      if (item) {
        item.note = note;
        saveCartToStorage(state);
      }
    },
    //Add service fees
    setServiceFees: (state, action) => {
      state.serviceFees = action.payload;
      saveCartToStorage(state);
    },

    initializeCart: (state) => {
      const savedCart = loadCartFromStorage();
      state.items = savedCart.items;
      state.serviceFees = savedCart.serviceFees || 0;
      updateCartTotals(state);
    }
  }
});

// Helper functions
const generateCartItemId = (productId, variations, addons, excludes, extras) => {
  const variationsStr = variations ? Object.entries(variations)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${Array.isArray(value) ? value.sort().join(',') : value}`)
    .join('|') : '';

  const addonsStr = addons ? Object.entries(addons)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
    .join('|') : '';

  const excludesStr = excludes ? excludes.sort().join(',') : '';

  const extrasStr = extras ? Object.entries(extras)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|') : '';

  return `${productId}|${variationsStr}|${addonsStr}|${excludesStr}|${extrasStr}`;
};

// Calculate tax for a single component (product, variation, addon)
// Calculate tax for a single component (product, variation, addon)
const calculateTaxForComponent = (price, taxObj, quantity = 1) => {
  if (!taxObj || !taxObj.amount) return { taxAmount: 0, priceAfterTax: price };

  const taxAmount = taxObj.type === 'precentage'
    ? (price * taxObj.amount) / 100
    : taxObj.amount;

  const taxSetting = taxObj.setting || 'excluded';
  const priceAfterTax = taxSetting === 'included' ? price : price + taxAmount;

  return {
    taxAmount: taxAmount * quantity,
    priceAfterTax: priceAfterTax * quantity,
    taxRate: taxObj.amount,
    taxType: taxObj.type,
    taxSetting: taxSetting
  };
};

const findOptionInProduct = (product, optionId) => {
  if (!product || !product.variations) return null;
  const targetId = typeof optionId === 'object' ? optionId.optionId : optionId;
  for (const variation of product.variations) {
    const option = variation.options?.find(o => String(o.id) === String(targetId));
    if (option) return option;
  }
  return null;
};

const calculateItemTaxDetails = (product, variations, addons, extras, quantity = 1) => {
  const taxDetails = {
    productTax: 0,
    variationTax: 0,
    addonTax: 0,
    extraTax: 0,
    totalTax: 0,
    taxableAmount: 0,
    taxBreakdown: []
  };

  if (!product) return taxDetails;
  const qty = parseFloat(quantity || 1);

  // 1. Product base tax
  let pTax = parseFloat(product.tax_val || product.tax_only || 0) * qty;
  const productTaxObj = product.tax_obj || product.tax || product.taxes;
  if (pTax === 0 && productTaxObj && productTaxObj.amount) {
    const calc = calculateTaxForComponent(
      parseFloat(product.price_after_discount || product.price || 0),
      productTaxObj,
      qty
    );
    pTax = calc.taxAmount;
  }
  taxDetails.productTax = pTax;

  taxDetails.taxBreakdown.push({
    name: product.name,
    type: 'product',
    taxableAmount: parseFloat(product.price_after_discount || product.price || 0) * qty,
    taxAmount: pTax,
    taxRate: productTaxObj?.amount || 0
  });

  // 2. Variation taxes
  if (variations) {
    Object.values(variations).forEach(optionIds => {
      const options = Array.isArray(optionIds) ? optionIds : [optionIds];
      options.forEach(optVal => {
        if (!optVal) return;
        const optId = typeof optVal === 'object' ? optVal.optionId : optVal;
        const weight = (typeof optVal === 'object' && optVal.value) ? parseFloat(optVal.value) : 1;
        const option = findOptionInProduct(product, optId);
        if (option) {
          let optTaxAmount = parseFloat(option.tax_val || option.tax_only || 0) * weight * qty;
          const optTaxObj = option.taxes || option.tax || productTaxObj;
          if (optTaxAmount === 0 && optTaxObj && optTaxObj.amount) {
            const optPrice = parseFloat(option.price || 0);
            const calc = calculateTaxForComponent(optPrice, optTaxObj, weight * qty);
            optTaxAmount = calc.taxAmount;
          }
          taxDetails.variationTax += optTaxAmount;

          taxDetails.taxBreakdown.push({
            name: `${product.name} - ${option.name}`,
            type: 'variation',
            taxableAmount: parseFloat(option.price || 0) * weight * qty,
            taxAmount: optTaxAmount,
            taxRate: optTaxObj?.amount || 0
          });
        }
      });
    });
  }

  // 3. Addon taxes
  if (addons) {
    Object.entries(addons).forEach(([addonId, addonData]) => {
      if (addonData && addonData.checked) {
        const addon = product.addons?.find(a => String(a.id) === String(addonId));
        if (addon) {
          const addonQty = parseFloat(addonData.quantity || 1);
          let addonTaxAmount = parseFloat(addon.tax_val || addon.tax_only || 0) * addonQty;
          const addonTaxObj = addon.tax || addon.taxes || productTaxObj;
          if (addonTaxAmount === 0 && addonTaxObj && addonTaxObj.amount) {
            const addonPrice = parseFloat(addon.price_after_discount || addon.price || 0);
            const calc = calculateTaxForComponent(addonPrice, addonTaxObj, addonQty);
            addonTaxAmount = calc.taxAmount;
          }
          taxDetails.addonTax += addonTaxAmount;

          taxDetails.taxBreakdown.push({
            name: `${product.name} - ${addon.name}`,
            type: 'addon',
            taxableAmount: parseFloat(addon.price_after_discount || addon.price || 0) * addonQty,
            taxAmount: addonTaxAmount,
            taxRate: addonTaxObj?.amount || 0
          });
        }
      }
    });
  }

  // 4. Extra taxes
  if (extras) {
    Object.entries(extras).forEach(([extraId, extraQty]) => {
      const count = parseFloat(extraQty || 0);
      if (count > 0) {
        const extra = [...(product.allExtras || []), ...(product.addons || [])]?.find(e => String(e.id) === String(extraId));
        if (extra) {
          let extraTaxAmount = parseFloat(extra.tax_val || extra.tax_only || 0) * count * qty;
          const extraTaxObj = extra.tax || extra.taxes || productTaxObj;
          if (extraTaxAmount === 0 && extraTaxObj && extraTaxObj.amount) {
            const extraPrice = parseFloat(extra.price_after_discount || extra.price || 0);
            const calc = calculateTaxForComponent(extraPrice, extraTaxObj, count * qty);
            extraTaxAmount = calc.taxAmount;
          }
          taxDetails.extraTax += extraTaxAmount;

          taxDetails.taxBreakdown.push({
            name: `${product.name} - ${extra.name}`,
            type: 'extra',
            taxableAmount: parseFloat(extra.price_after_discount || extra.price || 0) * count * qty,
            taxAmount: extraTaxAmount,
            taxRate: extraTaxObj?.amount || 0
          });
        }
      }
    });
  }

  taxDetails.totalTax = taxDetails.productTax + taxDetails.variationTax + taxDetails.addonTax + taxDetails.extraTax;
  return taxDetails;
};

const calculateItemTotal = (item) => {
  const product = item.product || {};
  let baseUnitPrice = parseFloat(product.final_price || product.price_after_tax || product.price_after_discount || item.basePrice || product.price || 0);
  let variationPrice = 0;

  if (item.variations) {
    Object.values(item.variations).forEach(optionIds => {
      const options = Array.isArray(optionIds) ? optionIds : [optionIds];
      options.forEach(optVal => {
        if (!optVal) return;
        const optId = typeof optVal === 'object' ? optVal.optionId : optVal;
        const weight = (typeof optVal === 'object' && optVal.value) ? parseFloat(optVal.value) : 1;
        const option = findOptionInProduct(product, optId);
        if (option) {
          variationPrice += parseFloat(option.final_price || option.price_after_tax || option.price || 0) * weight;
        }
      });
    });
  }

  const qty = parseFloat(item.quantity || 1);
  let total = (baseUnitPrice + variationPrice) * qty;

  if (item.addons) {
    Object.entries(item.addons).forEach(([addonId, addonData]) => {
      if (addonData && addonData.checked) {
        const addon = product.addons?.find(a => String(a.id) === String(addonId));
        if (addon) {
          const addonQty = parseFloat(addonData.quantity || 1);
          total += parseFloat(addon.final_price || addon.price_after_tax || addon.price_after_discount || addon.price || 0) * addonQty;
        }
      }
    });
  }

  if (item.extras) {
    Object.entries(item.extras).forEach(([extraId, extraQty]) => {
      const count = parseFloat(extraQty || 0);
      if (count > 0) {
        const extra = [...(product.allExtras || []), ...(product.addons || [])]?.find(e => String(e.id) === String(extraId));
        if (extra) {
          total += parseFloat(extra.final_price || extra.price_after_tax || extra.price_after_discount || extra.price || 0) * count * qty;
        }
      }
    });
  }

  return total;
};

const updateCartTotals = (state) => {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  state.items.forEach(item => {
    const itemTotal = calculateItemTotal(item);
    item.totalPrice = itemTotal;

    item.taxDetails = calculateItemTaxDetails(
      item.product,
      item.variations,
      item.addons,
      item.extras,
      item.quantity
    );

    subtotal += itemTotal;
    totalTax += item.taxDetails.totalTax || 0;

    const basePrice = parseFloat(item.product?.price || item.basePrice || 0) * item.quantity;
    const finalPrice = parseFloat(item.product?.final_price || item.product?.price_after_discount || item.basePrice || 0) * item.quantity;
    totalDiscount += Math.max(0, basePrice - finalPrice);
  });

  state.subtotal = parseFloat(subtotal.toFixed(2));
  state.netSubtotal = parseFloat(Math.max(0, subtotal - totalTax).toFixed(2));
  state.totalDiscount = parseFloat(totalDiscount.toFixed(2));
  state.totalTax = parseFloat(totalTax.toFixed(2));
  state.priceAfterDiscount = parseFloat(subtotal.toFixed(2));
  
  state.total = parseFloat(subtotal.toFixed(2));
  state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
};

export const {
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  incrementQuantity,
  decrementQuantity,
  updateItemNote,
  initializeCart,
  setServiceFees
} = cartSlice.actions;

export default cartSlice.reducer;