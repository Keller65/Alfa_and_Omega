import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductDiscount } from '@/types/types';

type CartItem = ProductDiscount & {
  quantity: number;
  unitPrice: number;
  total: number;
  tiers?: {
    qty: number;
    price: number;
    percent: number;
    expiry: string;
  }[];
};

interface Customer {
  cardCode: string;
  cardName: string;
  federalTaxID: string;
  priceListNum: string
}

interface AppStoreState {
  products: CartItem[];
  addProduct: (productToAdd: Omit<CartItem, 'total'>) => void;
  updateQuantity: (itemCode: string, quantity: number, newPrice?: number) => void;
  removeProduct: (itemCode: string) => void;
  clearCart: () => void;

  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer) => void;
  clearSelectedCustomer: () => void;

  allProductsCache: ProductDiscount[];
  setAllProductsCache: (products: ProductDiscount[]) => void;
  clearAllProductsCache: () => void;

  rawSearchText: string;
  debouncedSearchText: string;
  setRawSearchText: (text: string) => void;
  setDebouncedSearchText: (text: string) => void;

  lastOrderDocEntry: number | null;
  setLastOrderDocEntry: (docEntry: number) => void;
  clearLastOrderDocEntry: () => void;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      products: [],
      selectedCustomer: null,
      allProductsCache: [],
      rawSearchText: '',
      debouncedSearchText: '',
      lastOrderDocEntry: null,

      addProduct: (productToAdd) => {
        const products = get().products;
        const existingIndex = products.findIndex(p => p.itemCode === productToAdd.itemCode);
        const updatedProducts = [...products];

        const newQuantity = productToAdd.quantity;
        const unitPrice = productToAdd.unitPrice;
        const newTotal = unitPrice * newQuantity;

        if (newQuantity <= 0) {
          if (existingIndex > -1) {
            updatedProducts.splice(existingIndex, 1);
          }
        } else if (existingIndex > -1) {
          updatedProducts[existingIndex] = {
            ...products[existingIndex],
            ...productToAdd,
            quantity: newQuantity,
            unitPrice: unitPrice,
            total: newTotal,
          };
        } else {
          updatedProducts.push({
            ...productToAdd,
            quantity: newQuantity,
            unitPrice: unitPrice,
            total: newTotal,
          });
        }

        set({ products: updatedProducts });
      },

      updateQuantity: (itemCode, quantity, newPrice) => {
        const products = get().products;
        const index = products.findIndex(p => p.itemCode === itemCode);
        if (index > -1) {
          if (quantity <= 0) {
            const updated = products.filter(p => p.itemCode !== itemCode);
            set({ products: updated });
          } else {
            const product = products[index];
            const actualUnitPrice = newPrice !== undefined ? newPrice : product.unitPrice;
            const total = actualUnitPrice * quantity;

            const updatedProducts = [...products];
            updatedProducts[index] = {
              ...product,
              quantity,
              unitPrice: actualUnitPrice,
              total,
            };
            set({ products: updatedProducts });
          }
        }
      },

      removeProduct: (itemCode) => {
        const updated = get().products.filter(p => p.itemCode !== itemCode);
        set({ products: updated });
      },

      clearCart: () => set({ products: [] }),

      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
      clearSelectedCustomer: () => set({ selectedCustomer: null }),

      setAllProductsCache: (products) => set({ allProductsCache: products }),
      clearAllProductsCache: () => set({ allProductsCache: [] }),

      setRawSearchText: (text) => set({ rawSearchText: text }),
      setDebouncedSearchText: (text) => set({ debouncedSearchText: text }),

      setLastOrderDocEntry: (docEntry: number) => set({ lastOrderDocEntry: docEntry }),
      clearLastOrderDocEntry: () => set({ lastOrderDocEntry: null }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);