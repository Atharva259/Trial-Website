'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, Plus, Minus, X, Coffee, ShieldAlert,
  CreditCard, Smartphone, CheckCircle, RefreshCw, ChevronRight, UserCheck
} from 'lucide-react';
import { useRestaurant, MenuItem, Order } from '@/context/RestaurantContext';

export default function CustomerPage() {
  const router = useRouter();
  const { state, placeOrder, resetSystem } = useRestaurant();
  
  // UI States
  const [activeCategory, setActiveCategory] = useState<'All' | 'Burgers' | 'Sides' | 'Drinks'>('All');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'fulfillment' | 'payment' | 'processing' | 'success'>('cart');
  
  // Fulfillment state
  const [fulfillmentType, setFulfillmentType] = useState<'dine_in' | 'takeaway' | 'curbside'>('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [pickupTime, setPickupTime] = useState('15 mins');
  const [carModel, setCarModel] = useState('');
  const [carColor, setCarColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [processingStatus, setProcessingStatus] = useState('Connecting to payment gateway...');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Auth Status check for Role Selector
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    // Check if admin session cookie exists (informational for UI switch helper)
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAdminLoggedIn(true);
        }
      })
      .catch(() => {});
  }, []);

  // Cart operations
  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[id] <= 1) {
        delete updated[id];
      } else {
        updated[id]--;
      }
      return updated;
    });
  };

  const getCartTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getCartSubtotal = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = state.menu.find((m) => m.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  };

  // Fulfillment Validation
  const isFulfillmentValid = () => {
    if (fulfillmentType === 'dine_in') {
      return tableNumber.trim() !== '';
    }
    if (fulfillmentType === 'curbside') {
      return carModel.trim() !== '' && carColor.trim() !== '' && licensePlate.trim() !== '';
    }
    return true; // Counter pickup is pre-selected with time
  };

  // Payment process simulation
  const handleCheckoutSubmit = async () => {
    setCheckoutStep('processing');
    setProcessingStatus('Securing payment tunnel...');
    
    // Simulate gateway delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setProcessingStatus('Authorizing credit card / scanning UPI...');
    
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setProcessingStatus('Finalizing order ledger and inventory...');
    
    try {
      const orderItems = Object.entries(cart).map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity,
      }));

      const fulfillmentDetails = {
        tableNumber: fulfillmentType === 'dine_in' ? tableNumber : undefined,
        pickupTime: fulfillmentType === 'takeaway' ? pickupTime : undefined,
        carModel: fulfillmentType === 'curbside' ? carModel : undefined,
        carColor: fulfillmentType === 'curbside' ? carColor : undefined,
        licensePlate: fulfillmentType === 'curbside' ? licensePlate : undefined,
      };

      const order = placeOrder(orderItems, fulfillmentType, fulfillmentDetails, paymentMethod);
      if (order) {
        setLastPlacedOrder(order);
        setCheckoutStep('success');
        setCart({});
      } else {
        setCheckoutStep('cart');
        alert('Order processing failed. Please verify ingredient stock.');
      }
    } catch (err: any) {
      setCheckoutStep('cart');
      alert(err.message || 'Verification failed due to inventory constraints.');
    }
  };

  const handleRoleNavigation = (path: string) => {
    setShowRoleSelector(false);
    router.push(path);
  };

  // Filter menu items
  const filteredMenu = state.menu.filter((item) => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });

  // Check if active tracking order exists (if any in list is received/preparing/ready)
  const activeTrackingOrder = state.orders
    .filter((o) => o.status !== 'completed' && o.status !== 'cancelled')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  return (
    <div className="device-container">
      {/* Role Selector Badge */}
      <button className="role-switch-badge" onClick={() => setShowRoleSelector(!showRoleSelector)}>
        <span className={`dot ${isAdminLoggedIn ? 'active' : ''}`}></span>
        Switch Role
      </button>

      {/* Role Selector overlay modal */}
      {showRoleSelector && (
        <div className="drawer-backdrop" onClick={() => setShowRoleSelector(false)} style={{ zIndex: 2000 }}>
          <div className="drawer-sheet" style={{ zIndex: 2001 }}>
            <div className="drawer-handle"></div>
            <div className="drawer-header">
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Select App Context</h2>
              <button 
                onClick={() => setShowRoleSelector(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="drawer-body">
              <button 
                onClick={() => handleRoleNavigation('/')} 
                className="btn btn-secondary" 
                style={{ justifyContent: 'space-between', marginBottom: '12px', borderColor: 'var(--accent-color)' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>🍽️</span> Customer Ordering
                </span>
                <span style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '600' }}>Active</span>
              </button>
              <button 
                onClick={() => handleRoleNavigation('/kitchen')} 
                className="btn btn-secondary" 
                style={{ justifyContent: 'space-between', marginBottom: '12px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>🍳</span> Kitchen Screen (KDS)
                </span>
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => handleRoleNavigation('/pos')} 
                className="btn btn-secondary" 
                style={{ justifyContent: 'space-between', marginBottom: '12px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>💵</span> Cashier Counter POS
                </span>
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => handleRoleNavigation('/admin')} 
                className="btn btn-secondary" 
                style={{ justifyContent: 'space-between', marginBottom: '24px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>📦</span> Stock & Business Dashboard
                </span>
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => { resetSystem(); setShowRoleSelector(false); }} 
                className="btn btn-danger" 
                style={{ height: '44px', fontSize: '13px' }}
              >
                <RefreshCw size={14} />
                Reset Store Data to Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smartphone frame */}
      <div className="smartphone-frame">
        {/* Header */}
        <div className="screen-header">
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Welcome to
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>BiteFlow Diner</h1>
          </div>
          
          {/* Cart Icon trigger */}
          <button 
            onClick={() => { setCheckoutStep('cart'); setIsCartOpen(true); }}
            style={{ 
              position: 'relative', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--border-color)', 
              width: '42px', 
              height: '42px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <ShoppingBag size={20} />
            {getCartTotalItems() > 0 && (
              <span 
                style={{ 
                  position: 'absolute', 
                  top: '-4px', 
                  right: '-4px', 
                  background: 'var(--accent-color)', 
                  color: '#000', 
                  fontSize: '10px', 
                  fontWeight: '700', 
                  borderRadius: '50%', 
                  width: '18px', 
                  height: '18px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                {getCartTotalItems()}
              </span>
            )}
          </button>
        </div>

        {/* Dynamic Screen Area */}
        <div className="screen-content">
          {/* Active order tracker banner */}
          {activeTrackingOrder && (
            <div 
              className="glass-card" 
              onClick={() => {
                setLastPlacedOrder(activeTrackingOrder);
                setCheckoutStep('success');
                setIsCartOpen(true);
              }}
              style={{ 
                background: 'rgba(245, 158, 11, 0.08)',
                borderColor: 'var(--accent-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="spinner" style={{ color: 'var(--accent-color)', width: '16px', height: '16px', borderWidth: '2px' }}></span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700' }}>Active Order {activeTrackingOrder.orderNumber}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fulfillment Status: {activeTrackingOrder.status.toUpperCase()}</p>
                </div>
              </div>
              <ChevronRight size={16} color="var(--accent-color)" />
            </div>
          )}

          {/* Banner */}
          <div 
            style={{ 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #1f1a12 0%, #0d0d0f 100%)',
              border: '1px solid var(--border-color)',
              padding: '20px',
              marginBottom: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span style={{ background: 'var(--accent-glow)', color: 'var(--accent-color)', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '20px' }}>
                ⚡ FRESH TRIAL POS
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginTop: '12px', letterSpacing: '-0.5px' }}>
                Delicious Food,<br />Instant Pickup.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '6px' }}>
                Zero delivery queues. Grab your fresh meals straight from the counter or curbside.
              </p>
            </div>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.15 }}>
              <Coffee size={120} color="var(--accent-color)" />
            </div>
          </div>

          {/* Horizontal Category Filters */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
            {(['All', 'Burgers', 'Sides', 'Drinks'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: activeCategory === cat ? 'var(--accent-color)' : 'rgba(255,255,255,0.04)',
                  color: activeCategory === cat ? '#000' : 'var(--text-primary)',
                  border: '1px solid',
                  borderColor: activeCategory === cat ? 'var(--accent-color)' : 'var(--border-color)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Catalog Grid */}
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Menu Items
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredMenu.map((item) => {
              // Check stock level to disable add if unavailable
              let minStock = 999;
              for (const recipeItem of item.recipe) {
                const invItem = state.inventory[recipeItem.ingredientId];
                if (invItem) {
                  const stockAvail = Math.floor(invItem.stock / recipeItem.quantity);
                  if (stockAvail < minStock) minStock = stockAvail;
                }
              }
              const isOutOfStock = minStock <= 0;

              return (
                <div 
                  key={item.id} 
                  className="glass-card" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '14px',
                    borderColor: isOutOfStock ? 'rgba(239, 68, 68, 0.1)' : 'var(--border-color)',
                    opacity: isOutOfStock ? 0.65 : 1
                  }}
                >
                  <div style={{ flex: 1, paddingRight: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{item.name}</h4>
                      {isOutOfStock && (
                        <span style={{ fontSize: '9px', background: 'var(--danger-glow)', color: 'var(--danger-color)', padding: '2px 6px', borderRadius: '10px', fontWeight: '700' }}>
                          SOLD OUT
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px', lineHeight: '1.4' }}>
                      {item.description}
                    </p>
                    <p style={{ color: 'var(--accent-color)', fontWeight: '700', fontSize: '15px', marginTop: '8px' }}>
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Quantity add button */}
                  <div>
                    {cart[item.id] ? (
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          background: 'rgba(255,255,255,0.05)', 
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          padding: '4px' 
                        }}
                      >
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ padding: '0 8px', fontSize: '13px', fontWeight: '700' }}>{cart[item.id]}</span>
                        <button 
                          onClick={() => addToCart(item.id)}
                          disabled={isOutOfStock}
                          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item.id)}
                        disabled={isOutOfStock}
                        style={{
                          background: 'var(--text-primary)',
                          color: '#000',
                          border: 'none',
                          width: '36px',
                          height: '36px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Cart Badge Button */}
        {getCartTotalItems() > 0 && !isCartOpen && (
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '24px', 
              left: '0', 
              width: '100%', 
              padding: '0 20px', 
              zIndex: 999 
            }}
          >
            <button 
              onClick={() => { setCheckoutStep('cart'); setIsCartOpen(true); }}
              className="btn btn-primary"
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0 24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} />
                <span>View Order Cart ({getCartTotalItems()})</span>
              </div>
              <span style={{ fontWeight: '800' }}>${getCartSubtotal().toFixed(2)}</span>
            </button>
          </div>
        )}

        {/* Dynamic Cart slide-up sheet */}
        {isCartOpen && (
          <div className="drawer-backdrop" onClick={() => { if (checkoutStep !== 'processing') setIsCartOpen(false); }}>
            <div className="drawer-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-handle"></div>
              
              {/* Header based on step */}
              <div className="drawer-header">
                {checkoutStep === 'cart' && <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Your Cart Basket</h2>}
                {checkoutStep === 'fulfillment' && <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Fulfillment Detail</h2>}
                {checkoutStep === 'payment' && <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Checkout Payment</h2>}
                {checkoutStep === 'processing' && <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Processing Order</h2>}
                {checkoutStep === 'success' && <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Track Order</h2>}
                
                {checkoutStep !== 'processing' && (
                  <button 
                    onClick={() => setIsCartOpen(false)} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Drawer Content */}
              <div className="drawer-body">
                {/* STEP 1: CART LIST VIEW */}
                {checkoutStep === 'cart' && (
                  <div>
                    {Object.keys(cart).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                        <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                        <p>Your food cart is empty.</p>
                      </div>
                    ) : (
                      <div>
                        {Object.entries(cart).map(([id, qty]) => {
                          const item = state.menu.find((m) => m.id === id)!;
                          return (
                            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                              <div>
                                <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{item.name}</h4>
                                <p style={{ color: 'var(--accent-color)', fontSize: '13px', fontWeight: '600', marginTop: '2px' }}>
                                  ${(item.price * qty).toFixed(2)}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                                <button onClick={() => removeFromCart(id)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '28px', height: '28px', cursor: 'pointer' }}><Minus size={12} /></button>
                                <span style={{ fontSize: '13px', fontWeight: '700', padding: '0 6px' }}>{qty}</span>
                                <button onClick={() => addToCart(id)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '28px', height: '28px', cursor: 'pointer' }}><Plus size={12} /></button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Order Calculation Sheet */}
                        <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <span>Subtotal</span>
                            <span>${getCartSubtotal().toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <span>Taxes & Fees (8%)</span>
                            <span>${(getCartSubtotal() * 0.08).toFixed(2)}</span>
                          </div>
                          <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }}></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            <span>Fulfillment Total</span>
                            <span>${(getCartSubtotal() * 1.08).toFixed(2)}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => setCheckoutStep('fulfillment')} 
                          className="btn btn-primary" 
                          style={{ marginTop: '24px' }}
                        >
                          Select Pickup Option
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: FULFILLMENT SELECTOR */}
                {checkoutStep === 'fulfillment' && (
                  <div>
                    {/* Onsite Selector options */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                      {(['dine_in', 'takeaway', 'curbside'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFulfillmentType(type)}
                          style={{
                            flex: 1,
                            background: fulfillmentType === type ? 'var(--accent-glow)' : 'rgba(255,255,255,0.03)',
                            border: '1px solid',
                            borderColor: fulfillmentType === type ? 'var(--accent-color)' : 'var(--border-color)',
                            color: fulfillmentType === type ? 'var(--accent-color)' : 'var(--text-primary)',
                            padding: '12px 6px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {type === 'dine_in' && '🍽️ Dine-In'}
                          {type === 'takeaway' && '🛍️ Counter'}
                          {type === 'curbside' && '🚗 Curbside'}
                        </button>
                      ))}
                    </div>

                    {/* DYNAMIC FULFILLMENT INPUT FORMS */}
                    {fulfillmentType === 'dine_in' && (
                      <div className="form-group">
                        <label className="form-label">Table Number</label>
                        <select 
                          className="form-select"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                        >
                          <option value="">Select Table #</option>
                          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>Table {n}</option>
                          ))}
                        </select>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '6px' }}>
                          We will serve the dishes directly to your table when ready.
                        </p>
                      </div>
                    )}

                    {fulfillmentType === 'takeaway' && (
                      <div className="form-group">
                        <label className="form-label">Target Pickup Time</label>
                        <select 
                          className="form-select"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                        >
                          <option value="15 mins">As soon as ready (approx. 15 mins)</option>
                          <option value="30 mins">In 30 minutes</option>
                          <option value="45 mins">In 45 minutes</option>
                          <option value="1 hour">In 1 hour</option>
                        </select>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '6px' }}>
                          Pick up your order bags directly at the front counter.
                        </p>
                      </div>
                    )}

                    {fulfillmentType === 'curbside' && (
                      <div>
                        <div className="form-group">
                          <label className="form-label">Car Model / Make</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Toyota Camry" 
                            className="form-input"
                            value={carModel}
                            onChange={(e) => setCarModel(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Car Color</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Midnight Black" 
                            className="form-input"
                            value={carColor}
                            onChange={(e) => setCarColor(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">License Plate #</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 7XYZ99" 
                            className="form-input"
                            value={licensePlate}
                            onChange={(e) => setLicensePlate(e.target.value)}
                          />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '6px' }}>
                          Park in the designated Curbside slots and we will bring the bags to your car.
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                      <button onClick={() => setCheckoutStep('cart')} className="btn btn-secondary" style={{ flex: 1 }}>
                        Back
                      </button>
                      <button 
                        onClick={() => setCheckoutStep('payment')} 
                        disabled={!isFulfillmentValid()} 
                        className="btn btn-primary" 
                        style={{ flex: 2 }}
                      >
                        Proceed to Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: PAYMENT METHOD */}
                {checkoutStep === 'payment' && (
                  <div>
                    <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                      Payment Methods
                    </h3>
                    
                    <div 
                      onClick={() => setPaymentMethod('card')}
                      className="glass-card" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px', 
                        borderColor: paymentMethod === 'card' ? 'var(--accent-color)' : 'var(--border-color)',
                        background: paymentMethod === 'card' ? 'rgba(255,255,255,0.02)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <CreditCard size={24} color={paymentMethod === 'card' ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Credit / Debit Card</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Simulate payment swipe authorization</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setPaymentMethod('upi')}
                      className="glass-card" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px', 
                        borderColor: paymentMethod === 'upi' ? 'var(--accent-color)' : 'var(--border-color)',
                        background: paymentMethod === 'upi' ? 'rgba(255,255,255,0.02)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Smartphone size={24} color={paymentMethod === 'upi' ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Digital Wallet / UPI</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>UPI scan simulator code</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '36px' }}>
                      <button onClick={() => setCheckoutStep('fulfillment')} className="btn btn-secondary" style={{ flex: 1 }}>
                        Back
                      </button>
                      <button onClick={handleCheckoutSubmit} className="btn btn-primary" style={{ flex: 2 }}>
                        Authorize Payment: ${(getCartSubtotal() * 1.08).toFixed(2)}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: PROCESSING TRANSACTION */}
                {checkoutStep === 'processing' && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '4px', color: 'var(--accent-color)', margin: '0 auto 24px auto' }}></div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Authenticating Payment</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{processingStatus}</p>
                  </div>
                )}

                {/* STEP 5: SUCCESS RECEIPT & ORDER TRACKER TIMELINE */}
                {checkoutStep === 'success' && lastPlacedOrder && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--success-color)', marginBottom: '16px' }}>
                      <CheckCircle size={48} style={{ margin: '0 auto' }} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Payment Successful!</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                      Order number <strong style={{ color: 'var(--accent-color)' }}>{lastPlacedOrder.orderNumber}</strong> placed
                    </p>

                    {/* Receipt breakdown */}
                    <div 
                      className="glass-card" 
                      style={{ 
                        margin: '24px 0 16px 0', 
                        padding: '16px', 
                        background: 'rgba(255,255,255,0.01)', 
                        textAlign: 'left',
                        borderColor: 'rgba(255,255,255,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                        <span>Order Receipt</span>
                        <span>{new Date(lastPlacedOrder.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {lastPlacedOrder.items.map((item) => (
                        <div key={item.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                          <span>{item.name} <span style={{ color: 'var(--text-secondary)' }}>x{item.quantity}</span></span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '12px 0' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700' }}>
                        <span>Amount Paid ({lastPlacedOrder.paymentMethod.toUpperCase()})</span>
                        <span>${lastPlacedOrder.total.toFixed(2)}</span>
                      </div>

                      <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                        📍 <strong>Fulfillment:</strong>{' '}
                        {lastPlacedOrder.fulfillmentType === 'dine_in' && `Dine-In (Table ${lastPlacedOrder.fulfillmentDetails.tableNumber})`}
                        {lastPlacedOrder.fulfillmentType === 'takeaway' && `Counter Pickup (Estimated ${lastPlacedOrder.fulfillmentDetails.pickupTime})`}
                        {lastPlacedOrder.fulfillmentType === 'curbside' && `Curb-Side (${lastPlacedOrder.fulfillmentDetails.carColor} ${lastPlacedOrder.fulfillmentDetails.carModel} - ${lastPlacedOrder.fulfillmentDetails.licensePlate})`}
                      </div>
                    </div>

                    {/* LIVE TRACKING TIMELINE */}
                    <div style={{ textAlign: 'left', margin: '24px 0 32px 0' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Live Cooking Timeline
                      </h4>
                      <div style={{ position: 'relative', paddingLeft: '28px' }}>
                        {/* Vertical line connecting steps */}
                        <div style={{ position: 'absolute', left: '8px', top: '8px', width: '2px', height: '80%', background: 'rgba(255,255,255,0.05)' }}></div>
                        
                        {/* Step 1 */}
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                          <span 
                            style={{ 
                              position: 'absolute', 
                              left: '-28px', 
                              top: '2px', 
                              width: '18px', 
                              height: '18px', 
                              borderRadius: '50%', 
                              background: '#F59E0B', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '10px',
                              color: '#000',
                              fontWeight: '700'
                            }}
                          >
                            ✓
                          </span>
                          <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Order Received</h5>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Kitchen has logged the request</p>
                        </div>

                        {/* Step 2 */}
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                          <span 
                            style={{ 
                              position: 'absolute', 
                              left: '-28px', 
                              top: '2px', 
                              width: '18px', 
                              height: '18px', 
                              borderRadius: '50%', 
                              background: (lastPlacedOrder.status === 'preparing' || lastPlacedOrder.status === 'ready' || lastPlacedOrder.status === 'completed') ? '#F59E0B' : 'rgba(255,255,255,0.05)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '10px',
                              color: '#000',
                              fontWeight: '700'
                            }}
                          >
                            {(lastPlacedOrder.status === 'preparing' || lastPlacedOrder.status === 'ready' || lastPlacedOrder.status === 'completed') ? '✓' : '2'}
                          </span>
                          <h5 style={{ fontSize: '13px', fontWeight: '700', color: (lastPlacedOrder.status === 'preparing' || lastPlacedOrder.status === 'ready' || lastPlacedOrder.status === 'completed') ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            Preparing in Kitchen
                          </h5>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Chef is assembling your fresh foods</p>
                        </div>

                        {/* Step 3 */}
                        <div style={{ position: 'relative' }}>
                          <span 
                            style={{ 
                              position: 'absolute', 
                              left: '-28px', 
                              top: '2px', 
                              width: '18px', 
                              height: '18px', 
                              borderRadius: '50%', 
                              background: (lastPlacedOrder.status === 'ready' || lastPlacedOrder.status === 'completed') ? '#10B981' : 'rgba(255,255,255,0.05)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '10px',
                              color: '#000',
                              fontWeight: '700'
                            }}
                          >
                            {(lastPlacedOrder.status === 'ready' || lastPlacedOrder.status === 'completed') ? '✓' : '3'}
                          </span>
                          <h5 style={{ fontSize: '13px', fontWeight: '700', color: (lastPlacedOrder.status === 'ready' || lastPlacedOrder.status === 'completed') ? 'var(--success-color)' : 'var(--text-secondary)' }}>
                            Ready for Pickup / Serve!
                          </h5>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Hot and ready at target counter</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setIsCartOpen(false)} 
                      className="btn btn-secondary"
                    >
                      Done (Order More)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
