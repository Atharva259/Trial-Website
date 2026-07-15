'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Core Interfaces
export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  restockQuantity: number;
  costPerUnit: number;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Burgers' | 'Sides' | 'Drinks';
  recipe: RecipeItem[];
  imageUrl: string;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
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
  cashIn: number; // additional added
  cashOut: number; // payouts
  sales: number; // total cash sales
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
  resetSystem: () => void;
}

// Initial Data definitions
const INITIAL_INVENTORY: Record<string, Ingredient> = {
  bun: { id: 'bun', name: 'Burger Bun', stock: 50, threshold: 10, restockQuantity: 50, costPerUnit: 0.20 },
  patty: { id: 'patty', name: 'Beef Patty', stock: 40, threshold: 10, restockQuantity: 40, costPerUnit: 1.00 },
  cheese: { id: 'cheese', name: 'Cheese Slice', stock: 60, threshold: 15, restockQuantity: 60, costPerUnit: 0.15 },
  lettuce: { id: 'lettuce', name: 'Lettuce Leaf', stock: 30, threshold: 8, restockQuantity: 30, costPerUnit: 0.10 },
  chicken: { id: 'chicken', name: 'Chicken Breast', stock: 20, threshold: 5, restockQuantity: 20, costPerUnit: 1.50 },
  syrup: { id: 'syrup', name: 'Soda Syrup', stock: 100, threshold: 20, restockQuantity: 100, costPerUnit: 0.05 },
  coffee: { id: 'coffee', name: 'Coffee Beans (Portion)', stock: 100, threshold: 20, restockQuantity: 100, costPerUnit: 0.08 },
  milk: { id: 'milk', name: 'Milk (Portion)', stock: 40, threshold: 10, restockQuantity: 40, costPerUnit: 0.30 },
  sugar: { id: 'sugar', name: 'Sugar Pack', stock: 120, threshold: 30, restockQuantity: 120, costPerUnit: 0.02 },
};

const INITIAL_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Classic Cheeseburger',
    description: 'Juicy beef patty, melted cheddar cheese, fresh lettuce, toasted buns.',
    price: 8.99,
    category: 'Burgers',
    recipe: [
      { ingredientId: 'bun', quantity: 1 },
      { ingredientId: 'patty', quantity: 1 },
      { ingredientId: 'cheese', quantity: 1 },
      { ingredientId: 'lettuce', quantity: 1 },
    ],
    imageUrl: '/placeholder_burger.jpg',
  },
  {
    id: 'm2',
    name: 'Double Beast Burger',
    description: 'Two juicy beef patties, double cheddar cheese, fresh lettuce, toasted buns.',
    price: 12.99,
    category: 'Burgers',
    recipe: [
      { ingredientId: 'bun', quantity: 1 },
      { ingredientId: 'patty', quantity: 2 },
      { ingredientId: 'cheese', quantity: 2 },
      { ingredientId: 'lettuce', quantity: 1 },
    ],
    imageUrl: '/placeholder_double.jpg',
  },
  {
    id: 'm3',
    name: 'Crispy Chicken Wrap',
    description: 'Crispy chicken breast, fresh lettuce wrapped in a warm tortilla.',
    price: 9.49,
    category: 'Burgers', // Categorised as Burgers/Mains for simple mobile listing
    recipe: [
      { ingredientId: 'chicken', quantity: 1 },
      { ingredientId: 'lettuce', quantity: 1 },
    ],
    imageUrl: '/placeholder_wrap.jpg',
  },
  {
    id: 'm4',
    name: 'House Green Salad',
    description: 'Fresh organic garden lettuce leaves with vinaigrette.',
    price: 7.49,
    category: 'Sides',
    recipe: [
      { ingredientId: 'lettuce', quantity: 2 },
    ],
    imageUrl: '/placeholder_salad.jpg',
  },
  {
    id: 'm5',
    name: 'Craft Iced Latte',
    description: 'Premium espresso poured over ice and fresh milk, lightly sweetened.',
    price: 4.99,
    category: 'Drinks',
    recipe: [
      { ingredientId: 'coffee', quantity: 1 },
      { ingredientId: 'milk', quantity: 1 },
      { ingredientId: 'sugar', quantity: 1 },
    ],
    imageUrl: '/placeholder_latte.jpg',
  },
  {
    id: 'm6',
    name: 'Fountain Soda',
    description: 'Refreshing carbonated soft drink served over ice.',
    price: 2.49,
    category: 'Drinks',
    recipe: [
      { ingredientId: 'syrup', quantity: 1 },
      { ingredientId: 'sugar', quantity: 1 },
    ],
    imageUrl: '/placeholder_soda.jpg',
  },
];

const DEFAULT_STATE: RestaurantState = {
  menu: INITIAL_MENU,
  orders: [],
  inventory: INITIAL_INVENTORY,
  cashSession: {
    openingBalance: 150, // Default drawer cash
    cashIn: 0,
    cashOut: 0,
    sales: 0,
    refunds: 0,
    expectedBalance: 150,
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
};

const RestaurantContext = createContext<RestaurantContextProps | undefined>(undefined);
const STORAGE_KEY = 'biteflow_restaurant_state';

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

  // 3. Dynamic Refresh (Cross-Tab Sync) via Storage Listener
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
    else if (type === 'restock') cashOut += amount; // restocking paid out of drawer

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
            description: `Auto-restocked ${restockQty} units of ${ingredient.name} due to low stock`,
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
    // 1. Validate ingredient availability before placement
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

      // Calculate COGS and verify stock bounds
      for (const recipeItem of menuItem.recipe) {
        const ingredient = state.inventory[recipeItem.ingredientId];
        if (!ingredient) return null;
        
        // Cost analysis
        totalCogs += recipeItem.quantity * input.quantity * ingredient.costPerUnit;

        // Strict stock check (if auto stock is disabled, block if stock drops below 0)
        const required = recipeItem.quantity * input.quantity;
        if (!state.isAutoStockEnabled && ingredient.stock < required) {
          // Insufficient stock and auto-stocking is disabled
          throw new Error(`Insufficient stock for ${ingredient.name}`);
        }
      }
    }

    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
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
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'success', // cash pending until cashier drawer logs it
      timestamp: new Date().toISOString(),
    };

    setState((prev) => {
      // 1. Process ingredient stock deductions and auto-stock triggers
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

      // 2. Update cash register session
      let cashSession = { ...prev.cashSession };
      
      // If paid digitally or counter order paid in cash (processed immediately)
      if (paymentMethod !== 'cash' && cashSession.status === 'open') {
        // Digital sales don't go to drawer cash balance directly (they increase revenue sheet), 
        // but cash POS payments do
      } else if (paymentMethod === 'cash' && cashSession.status === 'open') {
        // Record Cash Sale in register
        cashSession = addTransactionToSession(
          cashSession,
          'sale',
          total,
          `POS Sale ${orderNumber}`
        );
      }

      // Record standard transaction sale in ledger
      const saleLog: LedgerLog = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'sale',
        description: `Order ${orderNumber} placed via ${paymentMethod} (${fulfillmentType})`,
        amount: total,
        cogs: totalCogs,
        timestamp: new Date().toISOString(),
      };

      allNewLogs.push(saleLog);

      // If auto-stock triggered, record that expense in ledger & cash session
      if (totalAutoRestockCost > 0) {
        if (cashSession.status === 'open') {
          cashSession = addTransactionToSession(
            cashSession,
            'restock',
            totalAutoRestockCost,
            `Auto-restocked raw materials`
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

      // Handle Cash payment confirmation when order is served/completed
      let cashSession = { ...prev.cashSession };
      let paymentStatus = order.paymentStatus;

      if (status === 'completed' && order.paymentMethod === 'cash' && order.paymentStatus === 'pending') {
        paymentStatus = 'success';
      }

      // Handle Cancellation refunds
      let refundedRevenue = 0;
      let refundedCogs = 0;
      const allNewLogs: LedgerLog[] = [];

      if (status === 'cancelled' && order.status !== 'cancelled') {
        paymentStatus = 'refunded';
        
        // Refund from cash drawer if cash sale
        if (order.paymentMethod === 'cash' && cashSession.status === 'open') {
          cashSession = addTransactionToSession(
            cashSession,
            'refund',
            order.total,
            `Refund order ${order.orderNumber}`
          );
        }

        refundedRevenue = order.total;

        // Log refund in ledger
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
