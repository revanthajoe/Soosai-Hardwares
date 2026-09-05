import { useEffect, useState } from 'react';
import { loadJSON, saveJSON, subscribeStorage } from '../utils/storage';

export const WISHLIST_KEY = 'soosai:wishlist';
export const COMPARE_KEY = 'soosai:compare';
export const CART_KEY = 'soosai:cart';

const KEYS = [WISHLIST_KEY, COMPARE_KEY, CART_KEY];

// Wishlist and compare store whole product objects rather than bare ids, so a
// saved item survives paging away from the result page it came from. Older
// visitors may still have id-only arrays in localStorage; those entries are
// dropped rather than rendered as blanks.
const normalizeSaved = (entries) =>
  (Array.isArray(entries) ? entries : []).filter((entry) => entry && typeof entry === 'object');

/**
 * Cart, wishlist and compare state backed by localStorage and kept in sync
 * across every component that uses it (and across browser tabs).
 *
 * Previously this logic was copy-pasted between ProductsPage and
 * ProductDetailPage, and HomePage had none of it at all — which is why the
 * buttons on featured product cards silently did nothing.
 */
export function useShoppingLists() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [compareItems, setCompareItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const refresh = () => {
      setWishlistItems(normalizeSaved(loadJSON(WISHLIST_KEY, [])));
      setCompareItems(normalizeSaved(loadJSON(COMPARE_KEY, [])));
      setCartItems(loadJSON(CART_KEY, []));
    };

    refresh();
    return subscribeStorage((key) => {
      if (KEYS.includes(key)) refresh();
    });
  }, []);

  const wishlistIds = wishlistItems.map((item) => item.id);
  const compareIds = compareItems.map((item) => item.id);

  const toggleWishlist = (product) => {
    saveJSON(
      WISHLIST_KEY,
      wishlistIds.includes(product.id)
        ? wishlistItems.filter((item) => item.id !== product.id)
        : [...wishlistItems, product]
    );
  };

  const toggleCompare = (product) => {
    if (compareIds.includes(product.id)) {
      saveJSON(COMPARE_KEY, compareItems.filter((item) => item.id !== product.id));
      return;
    }
    if (compareItems.length >= 3) return;
    saveJSON(COMPARE_KEY, [...compareItems, product]);
  };

  const clearCompare = () => saveJSON(COMPARE_KEY, []);

  const addToCart = (product, qty = 1) => {
    const current = [...cartItems];
    const index = current.findIndex((item) => item.id === product.id);

    if (index >= 0) {
      current[index] = { ...current[index], qty: current[index].qty + qty };
    } else {
      current.push({ id: product.id, qty, product });
    }

    saveJSON(CART_KEY, current);
  };

  const removeFromCart = (id) => {
    saveJSON(CART_KEY, cartItems.filter((item) => item.id !== id));
  };

  return {
    wishlistItems,
    wishlistIds,
    compareItems,
    compareIds,
    cartItems,
    toggleWishlist,
    toggleCompare,
    clearCompare,
    addToCart,
    removeFromCart,
  };
}
