/* eslint-disable no-param-reassign */
import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const checkProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (checkProducts) {
        setProducts(JSON.parse(checkProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const IndexOfProduct = products.findIndex(
        oldProduct => oldProduct.id === product.id,
      );

      if (IndexOfProduct >= 0) {
        const productsUpdated = products.map(oldProduct => {
          if (product.id === oldProduct.id) {
            oldProduct.quantity += 1;
          }
          return oldProduct;
        });
        setProducts(productsUpdated);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(productsUpdated),
        );
      } else {
        const newProduct = product;
        newProduct.quantity = 1;
        const productsUpdated = [...products, newProduct];
        setProducts(productsUpdated);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(productsUpdated),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product => {
        if (product.id !== id) {
          return product;
        }

        const updatedProduct = {
          ...product,
          quantity: product.quantity += 1,
        };

        return updatedProduct;
      });

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProducts = products
        .map(product => {
          if (product.id !== id) {
            return product;
          }

          const updatedProduct = {
            ...product,
            quantity: product.quantity -= 1,
          };

          return updatedProduct;
        })
        .filter(product => product.quantity > 0);

      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
