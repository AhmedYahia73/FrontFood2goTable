// Store/Slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const defaultState = {
  items: [],
  total: 0,
  itemCount: 0,
  subtotal: 0,
  totalDiscount: 0,
  totalTax: 0,
  totalTaxIncluded: 0,
  totalTaxExcluded: 0,
  priceAfterDiscount: 0,
  netSubtotal: 0,
  serviceFees: 0
};

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const serializedCart = localStorage.getItem('cart');
    if (!serializedCart) return defaultState;
    const parsed = JSON.parse(serializedCart);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) return defaultState;
    return { ...defaultState, ...parsed, items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch (err) {
    return defaultState;
  }
};

// Save cart to localStorage
const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (err) {
    console.error('Failed to save cart to localStorage:', err);
  }
};

// ── Get tax object from entity ───────────────────────────────────────────────
const getTaxObj = (entity, fallback = null) =>
  entity?.tax_obj || entity?.taxes || entity?.tax || fallback || null;

// ── Calculate tax amount for a price given a taxObj ─────────────────────────
// included: الضريبة مضمنة في السعر المعروض (لا تضاف للإجمالي)
// excluded: الضريبة خارج السعر (تضاف للإجمالي)
const calcTax = (price, taxObj) => {
  if (!taxObj || !parseFloat(taxObj.amount || 0)) return { taxAmount: 0, isTaxIncluded: false };
  const rate = parseFloat(taxObj.amount);
  const isTaxIncluded = taxObj.setting === 'included';
  const type = taxObj.type;
  let taxAmount = 0;
  if (type === 'precentage' || type === 'percentage') {
    taxAmount = isTaxIncluded
      ? price - (price / (1 + rate / 100))  // extract tax from inclusive price
      : (price * rate) / 100;                // add tax on top of exclusive price
  } else if (type === 'value') {
    taxAmount = rate;
  }
  return { taxAmount, isTaxIncluded };
};

// ── Get base price (before tax, after discount) ──────────────────────────────
const getBasePrice = (entity) =>
  parseFloat(entity?.price_after_discount || entity?.price || 0);

// ── Get display price (what customer pays; includes tax if included) ─────────
const getDisplayPrice = (entity, isTaxIncluded) => {
  if (isTaxIncluded) {
    return parseFloat(entity?.final_price || entity?.price_after_tax || entity?.price_after_discount || entity?.price || 0);
  }
  return parseFloat(entity?.price_after_discount || entity?.price || entity?.final_price || 0);
};

// ── Find variation option inside product ────────────────────────────────────
const findOption = (product, optionId) => {
  if (!product || !product.variations) return null;
  const targetId = typeof optionId === 'object' ? optionId.optionId : optionId;
  for (const variation of product.variations) {
    const option = variation.options?.find(o => String(o.id) === String(targetId));
    if (option) return option;
  }
  return null;
};

// ── Generate unique cart item ID ────────────────────────────────────────────
const generateCartItemId = (productId, variations, addons, excludes, extras) => {
  const vStr = variations ? Object.entries(variations)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${Array.isArray(v) ? v.sort().join(',') : (typeof v === 'object' ? v.optionId : v)}`).join('|') : '';

  const aStr = addons ? Object.entries(addons)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([_, data]) => data?.checked)
    .map(([k, data]) => `${k}:${data.quantity}`).join('|') : '';

  const eStr = excludes ? excludes.slice().sort().join(',') : '';

  const xStr = extras ? Object.entries(extras)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([_, qty]) => parseFloat(qty || 0) > 0)
    .map(([k, qty]) => `${k}:${qty}`).join('|') : '';

  return `${productId}|${vStr}|${aStr}|${eStr}|${xStr}`;
};

// ── Calculate item total (display price * qty + addons + extras) ─────────────
const calculateItemTotal = (item) => {
  const product = item.product || {};
  const qty = parseFloat(item.quantity || 1);
  const taxObj = getTaxObj(product);
  const isTaxIncluded = taxObj?.setting === 'included';

  let baseUnitPrice = getDisplayPrice(product, isTaxIncluded);
  let variationPrice = 0;

  if (item.variations) {
    Object.values(item.variations).forEach(optionIds => {
      const opts = Array.isArray(optionIds) ? optionIds : [optionIds];
      opts.forEach(optVal => {
        if (!optVal) return;
        const optId = typeof optVal === 'object' ? optVal.optionId : optVal;
        const weight = (typeof optVal === 'object' && optVal.value) ? parseFloat(optVal.value) : 1;
        const option = findOption(product, optId);
        if (option) variationPrice += getDisplayPrice(option, isTaxIncluded) * weight;
      });
    });
  }

  let total = (baseUnitPrice + variationPrice) * qty;

  if (item.addons) {
    Object.entries(item.addons).forEach(([addonId, addonData]) => {
      if (addonData?.checked) {
        const addon = product.addons?.find(a => String(a.id) === String(addonId));
        if (addon) total += getDisplayPrice(addon, isTaxIncluded) * parseFloat(addonData.quantity || 1);
      }
    });
  }

  if (item.extras) {
    Object.entries(item.extras).forEach(([extraId, extraQty]) => {
      const count = parseFloat(extraQty || 0);
      if (count > 0) {
        const extra = [...(product.allExtras || []), ...(product.addons || [])]
          ?.find(e => String(e.id) === String(extraId));
        if (extra) total += getDisplayPrice(extra, isTaxIncluded) * count * qty;
      }
    });
  }

  return total;
};

// ── Calculate tax details for an item ────────────────────────────────────────
const calculateItemTaxDetails = (product, variations, addons, extras, quantity = 1) => {
  const taxDetails = {
    productTax: 0, variationTax: 0, addonTax: 0, extraTax: 0,
    totalTax: 0, totalTaxIncluded: 0, totalTaxExcluded: 0,
    isTaxIncluded: false, taxBreakdown: []
  };
  if (!product) return taxDetails;
  const qty = parseFloat(quantity || 1);
  const productTaxObj = getTaxObj(product);

  // 1. Product tax
  let pTaxAmount = parseFloat(product.tax_val || product.tax_only || 0);
  let pIncluded = false;
  if (pTaxAmount === 0 && productTaxObj?.amount) {
    const { taxAmount, isTaxIncluded } = calcTax(getBasePrice(product), productTaxObj);
    pTaxAmount = taxAmount;
    pIncluded = isTaxIncluded;
  }
  taxDetails.productTax = pTaxAmount * qty;
  taxDetails.isTaxIncluded = pIncluded;
  taxDetails.taxBreakdown.push({
    name: product.name, type: 'product',
    taxableAmount: getBasePrice(product) * qty, taxAmount: pTaxAmount * qty,
    taxRate: productTaxObj?.amount || 0, isTaxIncluded: pIncluded
  });
  if (pIncluded) taxDetails.totalTaxIncluded += pTaxAmount * qty;
  else taxDetails.totalTaxExcluded += pTaxAmount * qty;

  // 2. Variation taxes
  if (variations) {
    Object.values(variations).forEach(optionIds => {
      const opts = Array.isArray(optionIds) ? optionIds : [optionIds];
      opts.forEach(optVal => {
        if (!optVal) return;
        const optId = typeof optVal === 'object' ? optVal.optionId : optVal;
        const weight = (typeof optVal === 'object' && optVal.value) ? parseFloat(optVal.value) : 1;
        const option = findOption(product, optId);
        if (option) {
          const optTaxObj = getTaxObj(option, productTaxObj);
          let t = parseFloat(option.tax_val || option.tax_only || 0);
          let tInc = false;
          if (t === 0 && optTaxObj?.amount) {
            const { taxAmount, isTaxIncluded } = calcTax(getBasePrice(option), optTaxObj);
            t = taxAmount; tInc = isTaxIncluded;
          }
          taxDetails.variationTax += t * weight * qty;
          taxDetails.taxBreakdown.push({
            name: option.name, type: 'variation',
            taxableAmount: getBasePrice(option) * weight * qty, taxAmount: t * weight * qty,
            taxRate: optTaxObj?.amount || 0, isTaxIncluded: tInc
          });
          if (tInc) taxDetails.totalTaxIncluded += t * weight * qty;
          else taxDetails.totalTaxExcluded += t * weight * qty;
        }
      });
    });
  }

  // 3. Addon taxes
  if (addons) {
    Object.entries(addons).forEach(([addonId, addonData]) => {
      if (addonData?.checked) {
        const addon = product.addons?.find(a => String(a.id) === String(addonId));
        if (addon) {
          const aqty = parseFloat(addonData.quantity || 1);
          const addonTaxObj = getTaxObj(addon, productTaxObj);
          let t = parseFloat(addon.tax_val || addon.tax_only || 0);
          let tInc = false;
          if (t === 0 && addonTaxObj?.amount) {
            const { taxAmount, isTaxIncluded } = calcTax(getBasePrice(addon), addonTaxObj);
            t = taxAmount; tInc = isTaxIncluded;
          }
          taxDetails.addonTax += t * aqty;
          taxDetails.taxBreakdown.push({
            name: addon.name, type: 'addon',
            taxableAmount: getBasePrice(addon) * aqty, taxAmount: t * aqty,
            taxRate: addonTaxObj?.amount || 0, isTaxIncluded: tInc
          });
          if (tInc) taxDetails.totalTaxIncluded += t * aqty;
          else taxDetails.totalTaxExcluded += t * aqty;
        }
      }
    });
  }

  // 4. Extra taxes
  if (extras) {
    Object.entries(extras).forEach(([extraId, extraQty]) => {
      const count = parseFloat(extraQty || 0);
      if (count > 0) {
        const extra = [...(product.allExtras || []), ...(product.addons || [])]
          ?.find(e => String(e.id) === String(extraId));
        if (extra) {
          const extraTaxObj = getTaxObj(extra, productTaxObj);
          let t = parseFloat(extra.tax_val || extra.tax_only || 0);
          let tInc = false;
          if (t === 0 && extraTaxObj?.amount) {
            const { taxAmount, isTaxIncluded } = calcTax(getBasePrice(extra), extraTaxObj);
            t = taxAmount; tInc = isTaxIncluded;
          }
          taxDetails.extraTax += t * count * qty;
          taxDetails.taxBreakdown.push({
            name: extra.name, type: 'extra',
            taxableAmount: getBasePrice(extra) * count * qty, taxAmount: t * count * qty,
            taxRate: extraTaxObj?.amount || 0, isTaxIncluded: tInc
          });
          if (tInc) taxDetails.totalTaxIncluded += t * count * qty;
          else taxDetails.totalTaxExcluded += t * count * qty;
        }
      }
    });
  }

  taxDetails.totalTax = taxDetails.productTax + taxDetails.variationTax + taxDetails.addonTax + taxDetails.extraTax;
  return taxDetails;
};

// ── Update cart-level totals ─────────────────────────────────────────────────
const updateCartTotals = (state) => {
  let subtotal = 0;
  let totalTaxIncluded = 0;
  let totalTaxExcluded = 0;
  let totalDiscount = 0;

  state.items.forEach(item => {
    item.totalPrice = calculateItemTotal(item);
    item.taxDetails = calculateItemTaxDetails(
      item.product, item.variations, item.addons, item.extras, item.quantity
    );
    subtotal += item.totalPrice;
    totalTaxIncluded += item.taxDetails.totalTaxIncluded || 0;
    totalTaxExcluded += item.taxDetails.totalTaxExcluded || 0;

    const qty = parseFloat(item.quantity || 1);
    const origPrice = parseFloat(item.product?.price || item.basePrice || 0) * qty;
    const finalPrice = parseFloat(item.product?.price_after_discount || item.product?.price || 0) * qty;
    totalDiscount += Math.max(0, origPrice - finalPrice);
  });

  // الإجمالي = subtotal + الضريبة الخارجية (لو الضريبة مضمنة فعلاً في subtotal مضافتش تاني)
  const totalTax = totalTaxIncluded + totalTaxExcluded;
  const finalTotal = subtotal + totalTaxExcluded;

  state.subtotal = parseFloat(subtotal.toFixed(2));
  state.netSubtotal = parseFloat((subtotal - totalTaxIncluded).toFixed(2));
  state.totalDiscount = parseFloat(totalDiscount.toFixed(2));
  state.totalTax = parseFloat(totalTax.toFixed(2));
  state.totalTaxIncluded = parseFloat(totalTaxIncluded.toFixed(2));
  state.totalTaxExcluded = parseFloat(totalTaxExcluded.toFixed(2));
  state.priceAfterDiscount = parseFloat(subtotal.toFixed(2));
  state.total = parseFloat(finalTotal.toFixed(2));
  state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
};

// ── Slice ────────────────────────────────────────────────────────────────────
const cartSlice = createSlice({
  name: 'cart',
  initialState: loadCartFromStorage(),
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity, variations, addons, excludes, extras, note } = action.payload;
      const itemId = generateCartItemId(product.id, variations, addons, excludes, extras);
      if (!Array.isArray(state.items)) state.items = [];
      const existingItem = state.items.find(item => item.id === itemId);
      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.note = note || existingItem.note;
        existingItem.totalPrice = calculateItemTotal(existingItem);
      } else {
        const newItem = {
          id: itemId, product, quantity,
          variations: variations || {}, addons: addons || {},
          excludes: excludes || [], extras: extras || {},
          note: note || '', totalPrice: 0,
          basePrice: getBasePrice(product),
          taxDetails: calculateItemTaxDetails(product, variations, addons, extras, quantity)
        };
        newItem.totalPrice = calculateItemTotal(newItem);
        state.items.push(newItem);
      }
      updateCartTotals(state);
      saveCartToStorage(state);
    },

    updateCartItem: (state, action) => {
      const { itemId, quantity, variations, addons, excludes, extras, note } = action.payload;
      if (!Array.isArray(state.items)) state.items = [];
      const item = state.items.find(item => item.id === itemId);
      if (item) {
        if (quantity !== undefined) item.quantity = quantity;
        if (variations) item.variations = variations;
        if (addons) item.addons = addons;
        if (excludes) item.excludes = excludes;
        if (extras) item.extras = extras;
        if (note !== undefined) item.note = note;
        item.taxDetails = calculateItemTaxDetails(item.product, item.variations, item.addons, item.extras, item.quantity);
        item.totalPrice = calculateItemTotal(item);
        updateCartTotals(state);
        saveCartToStorage(state);
      }
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      updateCartTotals(state);
      saveCartToStorage(state);
    },

    clearCart: (state) => {
      state.items = [];
      updateCartTotals(state);
      saveCartToStorage(state);
    },

    incrementQuantity: (state, action) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.quantity += 1;
        item.taxDetails = calculateItemTaxDetails(item.product, item.variations, item.addons, item.extras, item.quantity);
        item.totalPrice = calculateItemTotal(item);
        updateCartTotals(state);
        saveCartToStorage(state);
      }
    },

    decrementQuantity: (state, action) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        item.taxDetails = calculateItemTaxDetails(item.product, item.variations, item.addons, item.extras, item.quantity);
        item.totalPrice = calculateItemTotal(item);
        updateCartTotals(state);
        saveCartToStorage(state);
      }
    },

    updateItemNote: (state, action) => {
      const { itemId, note } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      if (item) { item.note = note; saveCartToStorage(state); }
    },

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

export const {
  addToCart, updateCartItem, removeFromCart, clearCart,
  incrementQuantity, decrementQuantity, updateItemNote,
  initializeCart, setServiceFees
} = cartSlice.actions;

export default cartSlice.reducer;
