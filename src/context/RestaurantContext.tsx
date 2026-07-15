'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Core Interfaces
export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  restockQuantity: number;
  costPerUnit: number; // in INR
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // in INR
  category: 'Snacks' | 'Mains' | 'Drinks';
  recipe: RecipeItem[];
  imageUrl: string;
  isVeg: boolean;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number; // in INR
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string; // #1001, #1002, etc.
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  fulfillmentType: 'dine_in' | 'takeaway' | 'curbside';
  fulfillmentDetails: {
    tableNumber?: string; // dine_in
    pickupTime?: string; // takeaway
    carModel?: string; // curbside
    carColor?: string; // curbside
    licensePlate?: string; // curbside
  };
  paymentMethod: 'card' | 'upi' | 'cash';
  paymentStatus: 'pending' | 'success' | 'refunded';
  timestamp: string;
}

export interface CashTransaction {
  id: string;
  type: 'cash_in' | 'payout' | 'sale' | 'refund' | 'restock';
  amount: number;
  description: string;
  timestamp: string;
}

export interface CashSession {
  openingBalance: number;
  cashIn: number;
  cashOut: number;
  sales: number;
  refunds: number;
  expectedBalance: number;
  actualBalance?: number;
  difference?: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  transactions: CashTransaction[];
}

export interface LedgerLog {
  id: string;
  type: 'sale' | 'restock' | 'payout' | 'cash_in' | 'refund';
  description: string;
  amount: number;
  cogs: number;
  timestamp: string;
}

export interface RestaurantState {
  menu: MenuItem[];
  orders: Order[];
  inventory: Record<string, Ingredient>;
  cashSession: CashSession;
  ledger: LedgerLog[];
  isAutoStockEnabled: boolean;
  revenue: number;
  cogs: number;
  restockExpenses: number;
  lastOrderNumber: number;
  merchantUpiId: string;
}

interface RestaurantContextProps {
  state: RestaurantState;
  placeOrder: (
    items: { menuItemId: string; quantity: number }[],
    fulfillmentType: 'dine_in' | 'takeaway' | 'curbside',
    fulfillmentDetails: Order['fulfillmentDetails'],
    paymentMethod: Order['paymentMethod']
  ) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  openCashDrawer: (balance: number) => void;
  closeCashDrawer: (actual: number) => void;
  adjustDrawerCash: (amount: number, type: 'cash_in' | 'payout', reason: string) => void;
  restockIngredient: (ingredientId: string, quantity: number) => void;
  toggleAutoStock: (enabled: boolean) => void;
  updateMerchantUpi: (upi: string) => void;
  resetSystem: () => void;
}

// Initial Indian Inventory (quantities and costs in INR)
const INITIAL_INVENTORY: Record<string, Ingredient> = {
  paneer: { id: 'paneer', name: 'Paneer (g)', stock: 5000, threshold: 1000, restockQuantity: 5000, costPerUnit: 0.25 }, // 25 paise per gram (Rs 250/kg)
  maida_wrap: { id: 'maida_wrap', name: 'Kathi Roll Wrap', stock: 50, threshold: 10, restockQuantity: 50, costPerUnit: 5.00 }, // Rs 5 each
  potatoes: { id: 'potatoes', name: 'Potatoes (g)', stock: 8000, threshold: 1500, restockQuantity: 8000, costPerUnit: 0.02 }, // Rs 20/kg
  pav_bun: { id: 'pav_bun', name: 'Pav Buns', stock: 60, threshold: 12, restockQuantity: 60, costPerUnit: 3.00 }, // Rs 3 each
  butter: { id: 'butter', name: 'Butter (g)', stock: 2000, threshold: 400, restockQuantity: 2000, costPerUnit: 0.50 }, // Rs 500/kg
  batter: { id: 'batter', name: 'Dosa Batter (ml)', stock: 10000, threshold: 2000, restockQuantity: 10000, costPerUnit: 0.05 }, // 5 paise per ml
  mango: { id: 'mango', name: 'Mango Pulp (ml)', stock: 4000, threshold: 800, restockQuantity: 4000, costPerUnit: 0.15 },
  milk: { id: 'milk', name: 'Milk (ml)', stock: 5000, threshold: 1000, restockQuantity: 5000, costPerUnit: 0.06 }, // Rs 60/litre
  tea_leaves: { id: 'tea_leaves', name: 'Tea Leaves (g)', stock: 1000, threshold: 200, restockQuantity: 1000, costPerUnit: 0.30 }, // Rs 300/kg
  sugar: { id: 'sugar', name: 'Sugar (g)', stock: 3000, threshold: 600, restockQuantity: 3000, costPerUnit: 0.04 }, // Rs 40/kg
};

// Localised Premium Indian Food Menu
const INITIAL_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Paneer Butter Masala Roll',
    description: 'Fresh soft cottage cheese chunks tossed in rich butter gravy, rolled in a flaky kathi wrap.',
    price: 180,
    category: 'Mains',
    recipe: [
      { ingredientId: 'paneer', quantity: 80 },
      { ingredientId: 'maida_wrap', quantity: 1 },
      { ingredientId: 'butter', quantity: 15 },
    ],
    imageUrl: '/paneer_roll.jpg',
    isVeg: true,
  },
  {
    id: 'm2',
    name: 'Double Butter Pav Bhaji',
    description: 'Spiced mashed vegetable curry slow-cooked with aromatic spices, served with two pav buns toasted in butter.',
    price: 150,
    category: 'Snacks',
    recipe: [
      { ingredientId: 'potatoes', quantity: 150 },
      { ingredientId: 'pav_bun', quantity: 2 },
      { ingredientId: 'butter', quantity: 30 },
    ],
    imageUrl: '/pav_bhaji.jpg',
    isVeg: true,
  },
  {
    id: 'm3',
    name: 'Crispy Masala Dosa',
    description: 'Golden thin crepe made of fermented rice-lentil batter, stuffed with spiced potato mash.',
    price: 120,
    category: 'Mains',
    recipe: [
      { ingredientId: 'batter', quantity: 150 },
      { ingredientId: 'potatoes', quantity: 100 },
      { ingredientId: 'butter', quantity: 10 },
    ],
    imageUrl: '/masala_dosa.jpg',
    isVeg: true,
  },
  {
    id: 'm4',
    name: 'Saffron Raj Kachori',
    description: 'King of kachoris! Large crispy shell stuffed with sprouts, yogurt, sweet chutney, and saffron threads.',
    price: 90,
    category: 'Snacks',
    recipe: [
      { ingredientId: 'potatoes', quantity: 50 },
      { ingredientId: 'sugar', quantity: 10 },
    ],
    imageUrl: '/raj_kachori.jpg',
    isVeg: true,
  },
  {
    id: 'm5',
    name: 'Mango Lassi Iced Shake',
    description: 'Thick yogurt shake blended with sweet Alphonso mango pulp, cardamom, and saffron garnish.',
    price: 80,
    category: 'Drinks',
    recipe: [
      { ingredientId: 'mango', quantity: 100 },
      { ingredientId: 'milk', quantity: 100 },
      { ingredientId: 'sugar', quantity: 15 },
    ],
    imageUrl: '/mango_lassi.jpg',
    isVeg: true,
  },
  {
    id: 'm6',
    name: 'Masala Cutting Chai',
    description: 'Brewed milk tea infused with crushed ginger, fresh cardamom, cloves, and cinnamon.',
    price: 40,
    category: 'Drinks',
    recipe: [
      { ingredientId: 'tea_leaves', quantity: 5 },
      { ingredientId: 'milk', quantity: 50 },
      { ingredientId: 'sugar', quantity: 8 },
    ],
    imageUrl: '/masala_chai.jpg',
    isVeg: true,
  },
];

const DEFAULT_STATE: RestaurantState = {
  menu: INITIAL_MENU,
  orders: [],
  inventory: INITIAL_INVENTORY,
  cashSession: {
    openingBalance: 2500, // Rs 2500 opening float for drawer cash
    cashIn: 0,
    cashOut: 0,
    sales: 0,
    refunds: 0,
    expectedBalance: 2500,
    status: 'open',
    openedAt: new Date().toISOString(),
    transactions: [],
  },
  ledger: [],
  isAutoStockEnabled: true,
  revenue: 0,
  cogs: 0,
  restockExpenses: 0,
  lastOrderNumber: 1000,
  merchantUpiId: 'admin@okaxis', // Default merchant account to test real-time payments
};

const RestaurantContext = createContext<RestaurantContextProps | undefined>(undefined);
const STORAGE_KEY = 'biteflow_restaurant_state_v2';

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RestaurantState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved state, using defaults');
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Save state changes to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  // 3. Cross-Tab Sync via Storage Listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Error parsing sync storage state', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper to log cash adjustments in active drawer session
  const addTransactionToSession = (
    session: CashSession,
    type: CashTransaction['type'],
    amount: number,
    description: string
  ): CashSession => {
    const transaction: CashTransaction = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      amount,
      description,
      timestamp: new Date().toISOString(),
    };
    
    let cashIn = session.cashIn;
    let cashOut = session.cashOut;
    let sales = session.sales;
    let refunds = session.refunds;

    if (type === 'cash_in') cashIn += amount;
    else if (type === 'payout') cashOut += amount;
    else if (type === 'sale') sales += amount;
    else if (type === 'refund') refunds += amount;
    else if (type === 'restock') cashOut += amount;

    const expectedBalance = session.openingBalance + cashIn - cashOut + sales - refunds;

    return {
      ...session,
      cashIn,
      cashOut,
      sales,
      refunds,
      expectedBalance,
      transactions: [...session.transactions, transaction],
    };
  };

  // Helper to recalculate inventory & trigger restocks if enabled
  const processInventoryDecr = (
    inventory: Record<string, Ingredient>,
    recipe: RecipeItem[],
    qty: number,
    ledgerLogs: LedgerLog[],
    isAutoEnabled: boolean
  ): { updatedInventory: Record<string, Ingredient>; purchaseCost: number; newLogs: LedgerLog[] } => {
    const updated = { ...inventory };
    let totalRestockCost = 0;
    const addedLogs: LedgerLog[] = [];

    for (const item of recipe) {
      const ingredient = updated[item.ingredientId];
      if (ingredient) {
        const required = item.quantity * qty;
        let newStock = ingredient.stock - required;

        // Auto stocking execution
        if (isAutoEnabled && newStock <= ingredient.threshold) {
          const restockQty = ingredient.restockQuantity;
          const cost = restockQty * ingredient.costPerUnit;
          
          newStock += restockQty;
          totalRestockCost += cost;

          addedLogs.push({
            id: Math.random().toString(36).substring(2, 9),
            type: 'restock',
            description: `Auto-purchased ${restockQty} units of ${ingredient.name} due to low warning limit`,
            amount: -cost,
            cogs: 0,
            timestamp: new Date().toISOString(),
          });
        }

        updated[item.ingredientId] = {
          ...ingredient,
          stock: newStock,
        };
      }
    }

    return { updatedInventory: updated, purchaseCost: totalRestockCost, newLogs: addedLogs };
  };

  // Core Actions
  const placeOrder = (
    orderItemsInput: { menuItemId: string; quantity: number }[],
    fulfillmentType: 'dine_in' | 'takeaway' | 'curbside',
    fulfillmentDetails: Order['fulfillmentDetails'],
    paymentMethod: Order['paymentMethod']
  ): Order | null => {
    let totalCogs = 0;
    let subtotal = 0;
    const items: OrderItem[] = [];

    for (const input of orderItemsInput) {
      const menuItem = state.menu.find((m) => m.id === input.menuItemId);
      if (!menuItem) return null;

      subtotal += menuItem.price * input.quantity;
      items.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: input.quantity,
      });

      for (const recipeItem of menuItem.recipe) {
        const ingredient = state.inventory[recipeItem.ingredientId];
        if (!ingredient) return null;
        
        totalCogs += recipeItem.quantity * input.quantity * ingredient.costPerUnit;

        const required = recipeItem.quantity * input.quantity;
        if (!state.isAutoStockEnabled && ingredient.stock < required) {
          throw new Error(`Insufficient stock for ${ingredient.name}`);
        }
      }
    }

    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST on food services in India
    const total = Math.round((subtotal + tax) * 100) / 100;

    const nextOrderNum = state.lastOrderNumber + 1;
    const orderNumber = `#${nextOrderNum}`;

    const newOrder: Order = {
      id: Math.random().toString(36).substring(2, 9),
      orderNumber,
      items,
      subtotal,
      tax,
      total,
      status: 'received',
      fulfillmentType,
      fulfillmentDetails,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'success', // card/upi processed instantly in mobile deep links
      timestamp: new Date().toISOString(),
    };

    setState((prev) => {
      let currentInventory = { ...prev.inventory };
      let totalAutoRestockCost = 0;
      let allNewLogs: LedgerLog[] = [];

      for (const input of orderItemsInput) {
        const menuItem = prev.menu.find((m) => m.id === input.menuItemId)!;
        const result = processInventoryDecr(
          currentInventory,
          menuItem.recipe,
          input.quantity,
          prev.ledger,
          prev.isAutoStockEnabled
        );
        currentInventory = result.updatedInventory;
        totalAutoRestockCost += result.purchaseCost;
        allNewLogs = [...allNewLogs, ...result.newLogs];
      }

      let cashSession = { ...prev.cashSession };
      
      if (paymentMethod === 'cash' && cashSession.status === 'open') {
        cashSession = addTransactionToSession(
          cashSession,
          'sale',
          total,
          `POS Cash Sale ${orderNumber}`
        );
      }

      const saleLog: LedgerLog = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'sale',
        description: `Order ${orderNumber} placed via ${paymentMethod} (${fulfillmentType})`,
        amount: total,
        cogs: totalCogs,
        timestamp: new Date().toISOString(),
      };

      allNewLogs.push(saleLog);

      if (totalAutoRestockCost > 0) {
        if (cashSession.status === 'open') {
          cashSession = addTransactionToSession(
            cashSession,
            'restock',
            totalAutoRestockCost,
            `Auto-purchased raw ingredients`
          );
        }
      }

      return {
        ...prev,
        orders: [...prev.orders, newOrder],
        inventory: currentInventory,
        cashSession,
        ledger: [...prev.ledger, ...allNewLogs],
        revenue: prev.revenue + total,
        cogs: prev.cogs + totalCogs,
        restockExpenses: prev.restockExpenses + totalAutoRestockCost,
        lastOrderNumber: nextOrderNum,
      };
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setState((prev) => {
      const orderIndex = prev.orders.findIndex((o) => o.id === orderId);
      if (orderIndex === -1) return prev;

      const updatedOrders = [...prev.orders];
      const order = updatedOrders[orderIndex];

      let cashSession = { ...prev.cashSession };
      let paymentStatus = order.paymentStatus;

      if (status === 'completed' && order.paymentMethod === 'cash' && order.paymentStatus === 'pending') {
        paymentStatus = 'success';
      }

      let refundedRevenue = 0;
      const allNewLogs: LedgerLog[] = [];

      if (status === 'cancelled' && order.status !== 'cancelled') {
        paymentStatus = 'refunded';
        
        if (order.paymentMethod === 'cash' && cashSession.status === 'open') {
          cashSession = addTransactionToSession(
            cashSession,
            'refund',
            order.total,
            `Refund order ${order.orderNumber}`
          );
        }

        refundedRevenue = order.total;

        allNewLogs.push({
          id: Math.random().toString(36).substring(2, 9),
          type: 'refund',
          description: `Refund order ${order.orderNumber} (cancelled)`,
          amount: -order.total,
          cogs: 0,
          timestamp: new Date().toISOString(),
        });
      }

      updatedOrders[orderIndex] = {
        ...order,
        status,
        paymentStatus,
      };

      return {
        ...prev,
        orders: updatedOrders,
        cashSession,
        ledger: [...prev.ledger, ...allNewLogs],
        revenue: prev.revenue - refundedRevenue,
      };
    });
  };

  const openCashDrawer = (balance: number) => {
    setState((prev) => ({
      ...prev,
      cashSession: {
        openingBalance: balance,
        cashIn: 0,
        cashOut: 0,
        sales: 0,
        refunds: 0,
        expectedBalance: balance,
        status: 'open',
        openedAt: new Date().toISOString(),
        transactions: [],
      },
    }));
  };

  const closeCashDrawer = (actual: number) => {
    setState((prev) => {
      const session = prev.cashSession;
      if (session.status !== 'open') return prev;

      const difference = actual - session.expectedBalance;

      return {
        ...prev,
        cashSession: {
          ...session,
          actualBalance: actual,
          difference,
          status: 'closed',
          closedAt: new Date().toISOString(),
        },
      };
    });
  };

  const adjustDrawerCash = (amount: number, type: 'cash_in' | 'payout', reason: string) => {
    setState((prev) => {
      let session = prev.cashSession;
      if (session.status !== 'open') return prev;

      session = addTransactionToSession(session, type, amount, reason);

      const ledgerLog: LedgerLog = {
        id: Math.random().toString(36).substring(2, 9),
        type: type === 'cash_in' ? 'cash_in' : 'payout',
        description: `Drawer cash adjustment: ${reason}`,
        amount: type === 'cash_in' ? amount : -amount,
        cogs: 0,
        timestamp: new Date().toISOString(),
      };

      return {
        ...prev,
        cashSession: session,
        ledger: [...prev.ledger, ledgerLog],
      };
    });
  };

  const restockIngredient = (ingredientId: string, quantity: number) => {
    setState((prev) => {
      const ingredient = prev.inventory[ingredientId];
      if (!ingredient) return prev;

      const cost = quantity * ingredient.costPerUnit;

      const updatedInventory = {
        ...prev.inventory,
        [ingredientId]: {
          ...ingredient,
          stock: ingredient.stock + quantity,
        },
      };

      let cashSession = prev.cashSession;
      if (cashSession.status === 'open') {
        cashSession = addTransactionToSession(
          cashSession,
          'restock',
          cost,
          `Manual restock: ${quantity} units of ${ingredient.name}`
        );
      }

      const restockLog: LedgerLog = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'restock',
        description: `Manual restock: ${quantity} units of ${ingredient.name}`,
        amount: -cost,
        cogs: 0,
        timestamp: new Date().toISOString(),
      };

      return {
        ...prev,
        inventory: updatedInventory,
        cashSession,
        ledger: [...prev.ledger, restockLog],
        restockExpenses: prev.restockExpenses + cost,
      };
    });
  };

  const toggleAutoStock = (enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      isAutoStockEnabled: enabled,
    }));
  };

  const updateMerchantUpi = (upi: string) => {
    setState((prev) => ({
      ...prev,
      merchantUpiId: upi,
    }));
  };

  const resetSystem = () => {
    setState(DEFAULT_STATE);
  };

  return (
    <RestaurantContext.Provider
      value={{
        state,
        placeOrder,
        updateOrderStatus,
        openCashDrawer,
        closeCashDrawer,
        adjustDrawerCash,
        restockIngredient,
        toggleAutoStock,
        updateMerchantUpi,
        resetSystem,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
