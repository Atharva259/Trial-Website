'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, Pocket, Plus, Minus, Search, LogOut, Lock, Unlock, ArrowUpRight, ArrowDownLeft, X
} from 'lucide-react';
import { useRestaurant, OrderItem } from '@/context/RestaurantContext';

export default function PosPage() {
  const router = useRouter();
  const { state, placeOrder, openCashDrawer, closeCashDrawer, adjustDrawerCash, updateOrderStatus } = useRestaurant();

  // POS Order states
  const [posCart, setPosCart] = useState<Record<string, number>>({});
  const [posSearch, setPosSearch] = useState('');
  
  // Drawer input states
  const [openingBalanceInput, setOpeningBalanceInput] = useState('150');
  const [actualBalanceInput, setActualBalanceInput] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'cash_in' | 'payout'>('cash_in');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  // Modal toggle states
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      alert('Failed to log out cleanly.');
    }
  };

  // Pos Cart actions
  const addToPosCart = (id: string) => {
    setPosCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromPosCart = (id: string) => {
    setPosCart((prev) => {
      const updated = { ...prev };
      if (updated[id] <= 1) {
        delete updated[id];
      } else {
        updated[id]--;
      }
      return updated;
    });
  };

  const getPosCartTotal = () => {
    const sub = Object.entries(posCart).reduce((sum, [id, qty]) => {
      const item = state.menu.find((m) => m.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
    return Math.round(sub * 1.08 * 100) / 100;
  };

  const handlePosCheckout = () => {
    if (Object.keys(posCart).length === 0) return;
    
    try {
      const orderItems = Object.entries(posCart).map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity,
      }));

      // Cash Counter orders default to dine-in at the counter or counter takeaway
      const order = placeOrder(
        orderItems, 
        'takeaway', 
        { pickupTime: 'Immediate Counter Sale' }, 
        'cash' // Default POS order payment is Cash
      );

      if (order) {
        // Automatically mark as completed because counter customer receives food immediately
        updateOrderStatus(order.id, 'completed');
        setPosCart({});
        alert(`POS Walk-in Cash Order ${order.orderNumber} Completed Successfully!`);
      } else {
        alert('Order failed. Verify ingredient stock.');
      }
    } catch (err: any) {
      alert(err.message || 'POS Checkout failed due to inventory bounds.');
    }
  };

  const handleOpenDrawer = () => {
    const amt = parseFloat(openingBalanceInput);
    if (isNaN(amt) || amt < 0) return;
    openCashDrawer(amt);
    setShowDrawerModal(false);
  };

  const handleCloseDrawer = () => {
    const amt = parseFloat(actualBalanceInput);
    if (isNaN(amt) || amt < 0) return;
    closeCashDrawer(amt);
    setActualBalanceInput('');
    setShowDrawerModal(false);
  };

  const handleAdjustDrawer = () => {
    const amt = parseFloat(adjustmentAmount);
    if (isNaN(amt) || amt <= 0 || !adjustmentReason.trim()) return;
    adjustDrawerCash(amt, adjustmentType, adjustmentReason);
    setAdjustmentAmount('');
    setAdjustmentReason('');
    setShowAdjustmentModal(false);
  };

  const filteredMenu = state.menu.filter(m => 
    m.name.toLowerCase().includes(posSearch.toLowerCase())
  );

  const isDrawerOpen = state.cashSession.status === 'open';

  return (
    <div className="device-container">
      {/* Role Switch badge */}
      <button className="role-switch-badge" onClick={() => router.push('/')}>
        🍽 Customer Site
      </button>

      <div className="smartphone-frame">
        {/* Header */}
        <div className="screen-header">
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Cash POS Terminal
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Counter Sales</h1>
          </div>
          
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid var(--danger-color)', 
              width: '42px', 
              height: '42px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--danger-color)',
              cursor: 'pointer'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Screen Content */}
        <div className="screen-content">
          {/* DRAWER STATE SUMMARY BAR */}
          <div 
            className="glass-card" 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderColor: isDrawerOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              background: isDrawerOpen ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.04)'
            }}
          >
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>CASH REGISTER SESSION</p>
              <h4 style={{ fontSize: '15px', fontWeight: '800', marginTop: '2px' }}>
                {isDrawerOpen ? `Drawer Open ($${state.cashSession.expectedBalance.toFixed(2)})` : 'Register Locked / Closed'}
              </h4>
            </div>
            
            <button
              onClick={() => setShowDrawerModal(true)}
              style={{
                background: isDrawerOpen ? 'rgba(255,255,255,0.06)' : 'var(--accent-color)',
                color: isDrawerOpen ? 'var(--text-primary)' : '#000',
                border: '1px solid var(--border-color)',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isDrawerOpen ? <Lock size={12} /> : <Unlock size={12} />}
              {isDrawerOpen ? 'Close Drawer' : 'Open Drawer'}
            </button>
          </div>

          {!isDrawerOpen ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <Lock size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h4 style={{ color: 'var(--text-primary)', fontWeight: '700' }}>POS Drawer Closed</h4>
              <p style={{ fontSize: '12px', marginTop: '6px' }}>Open the cash drawer session first to place over-the-counter cash orders and log transactions.</p>
              <button onClick={() => setShowDrawerModal(true)} className="btn btn-primary" style={{ marginTop: '20px' }}>
                Initialize Cash Drawer
              </button>
            </div>
          ) : (
            <div>
              {/* Drawer Cash Adjustments Panel */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button 
                  onClick={() => { setAdjustmentType('cash_in'); setShowAdjustmentModal(true); }}
                  className="btn btn-secondary" 
                  style={{ flex: 1, height: '40px', fontSize: '12px', gap: '4px' }}
                >
                  <ArrowUpRight size={14} color="var(--success-color)" /> Add Cash
                </button>
                <button 
                  onClick={() => { setAdjustmentType('payout'); setShowAdjustmentModal(true); }}
                  className="btn btn-secondary" 
                  style={{ flex: 1, height: '40px', fontSize: '12px', gap: '4px' }}
                >
                  <ArrowDownLeft size={14} color="var(--danger-color)" /> Payout Cash
                </button>
              </div>

              {/* SEARCH MENU */}
              <div className="form-group" style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Search food item..." 
                  className="form-input" 
                  style={{ paddingLeft: '44px' }}
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                />
              </div>

              {/* MOCK POS ORDER CART */}
              {Object.keys(posCart).length > 0 && (
                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Walk-in Order Cart
                  </h4>
                  {Object.entries(posCart).map(([id, qty]) => {
                    const menuItem = state.menu.find(m => m.id === id)!;
                    return (
                      <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                        <span>{menuItem.name} <span style={{ color: 'var(--text-secondary)' }}>x{qty}</span></span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={() => removeFromPosCart(id)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                          <button onClick={() => addToPosCart(id)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={handlePosCheckout} className="btn btn-primary" style={{ marginTop: '16px', height: '44px' }}>
                    Record Cash Sale: ${getPosCartTotal().toFixed(2)}
                  </button>
                </div>
              )}

              {/* POS MENU ITEMS CATALOG */}
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                Counter Menu Grid
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredMenu.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => addToPosCart(item.id)}
                    className="glass-card"
                    style={{ 
                      padding: '12px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '0',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{item.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>${item.price.toFixed(2)}</p>
                    </div>
                    <Plus size={16} color="var(--accent-color)" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MOCK DRAWER OPEN/CLOSE DIALOG */}
        {showDrawerModal && (
          <div className="drawer-backdrop" onClick={() => setShowDrawerModal(false)} style={{ zIndex: 2000 }}>
            <div className="drawer-sheet" style={{ zIndex: 2001 }} onClick={(e) => e.stopPropagation()}>
              <div className="drawer-handle"></div>
              <div className="drawer-header">
                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>
                  {isDrawerOpen ? 'Close Cash Drawer Session' : 'Open Cash Drawer Session'}
                </h2>
                <button onClick={() => setShowDrawerModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}><X size={20} /></button>
              </div>
              <div className="drawer-body">
                {isDrawerOpen ? (
                  <div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span>Opening balance:</span> <span>${state.cashSession.openingBalance.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span>Cash Sales:</span> <span>+${state.cashSession.sales.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span>Cash Payouts/Restocks:</span> <span>-${state.cashSession.cashOut.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span>Refunds:</span> <span>-${state.cashSession.refunds.toFixed(2)}</span>
                      </div>
                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                        <span>Expected Drawer Cash:</span> <span>${state.cashSession.expectedBalance.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Actual Cash Counted ($)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="e.g. 150.50" 
                        value={actualBalanceInput}
                        onChange={(e) => setActualBalanceInput(e.target.value)}
                      />
                    </div>

                    <button onClick={handleCloseDrawer} className="btn btn-danger" style={{ marginTop: '12px' }}>
                      Audit & Close Register
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Opening Cash Float ($)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="e.g. 150" 
                        value={openingBalanceInput}
                        onChange={(e) => setOpeningBalanceInput(e.target.value)}
                      />
                    </div>
                    <button onClick={handleOpenDrawer} className="btn btn-primary" style={{ marginTop: '12px' }}>
                      Initialize Session
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CASH ADJUSTMENT DIALOG */}
        {showAdjustmentModal && (
          <div className="drawer-backdrop" onClick={() => setShowAdjustmentModal(false)} style={{ zIndex: 2000 }}>
            <div className="drawer-sheet" style={{ zIndex: 2001 }} onClick={(e) => e.stopPropagation()}>
              <div className="drawer-handle"></div>
              <div className="drawer-header">
                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>
                  {adjustmentType === 'cash_in' ? 'Drawer Cash In' : 'Drawer Cash Payout'}
                </h2>
                <button onClick={() => setShowAdjustmentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}><X size={20} /></button>
              </div>
              <div className="drawer-body">
                <div className="form-group">
                  <label className="form-label">Adjustment Amount ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 20.00" 
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason / Notes</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder={adjustmentType === 'cash_in' ? 'e.g. Added rolls of quarters' : 'e.g. Paid vendor for bread buns'} 
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                  />
                </div>
                <button onClick={handleAdjustDrawer} className="btn btn-primary" style={{ marginTop: '12px' }}>
                  Confirm Adjustment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
