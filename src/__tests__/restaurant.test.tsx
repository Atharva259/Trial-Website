import React from 'react';
import { render, act } from '@testing-library/react';
import { RestaurantProvider, useRestaurant } from '../context/RestaurantContext';
import { describe, it, expect, beforeEach } from 'vitest';

// Test consumer to access context methods during tests
const TestComponent = ({ onState }: { onState: (actions: any) => void }) => {
  const actions = useRestaurant();
  
  React.useEffect(() => {
    onState(actions);
  }, [actions, onState]);

  return <div>Test Component</div>;
};

describe('BiteFlow Restaurant Context State Engine', () => {
  
  beforeEach(() => {
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

    // Place an order for 1 Paneer Butter Masala Roll (m1)
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

    // Default opening expected drawer cash balance is Rs 2500
    expect(actions.state.cashSession.expectedBalance).toBe(2500);

    // Perform a cash-in adjustment (e.g. adding float change)
    act(() => {
      actions.adjustDrawerCash(500, 'cash_in', 'Register coins replenishment');
    });

    expect(actions.state.cashSession.expectedBalance).toBe(3000);

    // Perform a cash payout adjustment (e.g. paying supplier for milk)
    act(() => {
      actions.adjustDrawerCash(350, 'payout', 'Supplier payout for fresh milk');
    });

    expect(actions.state.cashSession.expectedBalance).toBe(2650);
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

    const initialPavBuns = actions.state.inventory.pav_bun.stock;
    expect(initialPavBuns).toBe(60); // Initial pav buns stock count is 60

    // Order 25 Pav Bhajis (requires 50 pav buns)
    // 60 - 50 = 10 pav buns left. 10 is <= pav_bun threshold (12).
    // Auto-restocking should trigger (+60 pav buns restock quantity)
    // Final stock level should be 60 - 50 + 60 = 70 pav buns.
    act(() => {
      actions.placeOrder(
        [{ menuItemId: 'm2', quantity: 25 }],
        'takeaway',
        { pickupTime: '20 mins' },
        'card'
      );
    });

    expect(actions.state.inventory.pav_bun.stock).toBe(70);
    expect(actions.state.restockExpenses).toBeGreaterThan(0);
  });
});
