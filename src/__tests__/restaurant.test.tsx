import React from 'react';
import { render, act } from '@testing-library/react';
import { RestaurantProvider, useRestaurant } from '../context/RestaurantContext';
import { describe, it, expect, beforeEach } from 'vitest';

// Test consumer to access context methods during tests
const TestComponent = ({ onState }: { onState: (actions: any) => void }) => {
  const actions = useRestaurant();
  
  // Expose context actions to test scope
  React.useEffect(() => {
    onState(actions);
  }, [actions, onState]);

  return <div>Test Component</div>;
};

describe('BiteFlow Restaurant Context State Engine', () => {
  
  beforeEach(() => {
    // Clear localStorage to isolate tests
    localStorage.clear();
  });
  
  it('should initialize lastOrderNumber at 1000 and increment sequentially', () => {
    let actions: any = null;
    
    render(
      <RestaurantProvider>
        <TestComponent onState={(a) => { actions = a; }} />
      </RestaurantProvider>
    );

    expect(actions).not.toBeNull();
    expect(actions.state.lastOrderNumber).toBe(1000);

    // Place an order for 1 Cheeseburger
    act(() => {
      actions.placeOrder(
        [{ menuItemId: 'm1', quantity: 1 }],
        'dine_in',
        { tableNumber: '10' },
        'card'
      );
    });

    expect(actions.state.lastOrderNumber).toBe(1001);
    expect(actions.state.orders[0].orderNumber).toBe('#1001');
    expect(actions.state.orders[0].fulfillmentDetails.tableNumber).toBe('10');
  });

  it('should adjust register cash drawer expected balance correctly on cash-in and payouts', () => {
    let actions: any = null;
    
    render(
      <RestaurantProvider>
        <TestComponent onState={(a) => { actions = a; }} />
      </RestaurantProvider>
    );

    // Default opening expected drawer cash balance is $150
    expect(actions.state.cashSession.expectedBalance).toBe(150);

    // Perform a cash-in adjustment (e.g. adding coins float)
    act(() => {
      actions.adjustDrawerCash(50, 'cash_in', 'Register coins replenishment');
    });

    expect(actions.state.cashSession.expectedBalance).toBe(200);

    // Perform a cash payout adjustment (e.g. paying supplier for wraps)
    act(() => {
      actions.adjustDrawerCash(35, 'payout', 'Supplier payout for tortilla wraps');
    });

    expect(actions.state.cashSession.expectedBalance).toBe(165);
  });

  it('should trigger auto-stocking replenishment when stock level drops below threshold', () => {
    let actions: any = null;
    
    render(
      <RestaurantProvider>
        <TestComponent onState={(a) => { actions = a; }} />
      </RestaurantProvider>
    );

    // Ensure auto-stocking engine is enabled
    act(() => {
      actions.toggleAutoStock(true);
    });

    expect(actions.state.isAutoStockEnabled).toBe(true);

    const initialBuns = actions.state.inventory.bun.stock;
    expect(initialBuns).toBe(50); // Initial burger buns stock count

    // Order 42 Classic Cheeseburgers (requires 42 buns)
    // 50 - 42 = 8 buns left. 8 is <= bun threshold (10).
    // Auto-restocking should trigger (+50 buns restock quantity)
    // Final stock level should be 50 - 42 + 50 = 58 buns.
    act(() => {
      actions.placeOrder(
        [{ menuItemId: 'm1', quantity: 42 }],
        'takeaway',
        { pickupTime: '20 mins' },
        'card'
      );
    });

    expect(actions.state.inventory.bun.stock).toBe(58);
    expect(actions.state.restockExpenses).toBeGreaterThan(0);
  });
});
