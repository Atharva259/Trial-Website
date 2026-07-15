'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Settings, LogOut, RefreshCw, Layers 
} from 'lucide-react';
import { useRestaurant } from '@/context/RestaurantContext';

export default function AdminPage() {
  const router = useRouter();
  const { state, restockIngredient, toggleAutoStock, resetSystem } = useRestaurant();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      alert('Failed to log out cleanly.');
    }
  };

  const getStockPercentage = (stock: number, threshold: number) => {
    const max = threshold * 5; // Simulating max display stock
    return Math.min((stock / max) * 100, 100);
  };

  const getStockColor = (stock: number, threshold: number) => {
    if (stock <= threshold) return 'var(--danger-color)';
    if (stock <= threshold * 1.5) return 'var(--accent-color)';
    return 'var(--success-color)';
  };

  // Financial calculations
  const totalRevenue = state.revenue;
  const totalCogs = state.cogs;
  const totalRestock = state.restockExpenses;
  const netProfit = totalRevenue - totalCogs - totalRestock;

  return (
    <div className="device-container">
      {/* Role Switch badge */}
      <button className="role-switch-badge" onClick={() => router.push('/')}>
        🍽️ Customer Site
      </button>

      <div className="smartphone-frame">
        {/* Header */}
        <div className="screen-header">
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Management Terminal
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Inventory POS</h1>
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
          {/* FINANCIAL LEDGER OVERVIEW */}
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Financial Ledger Sheet
          </h3>
          <div className="glass-card" style={{ background: 'rgba(255,255,255,0.01)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Net Trial Profit</span>
                <h2 style={{ fontSize: '28px', fontWeight: '800', color: netProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)', marginTop: '4px' }}>
                  ${netProfit.toFixed(2)}
                </h2>
              </div>
              <div 
                style={{ 
                  background: netProfit >= 0 ? 'var(--success-glow)' : 'var(--danger-glow)',
                  color: netProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {netProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '16px 0' }}></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>SALES</span>
                <p style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px', color: '#fff' }}>
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>COGS</span>
                <p style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px', color: 'var(--text-secondary)' }}>
                  -${totalCogs.toFixed(2)}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>RESTOCKS</span>
                <p style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px', color: 'var(--danger-color)' }}>
                  -${totalRestock.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* AUTO-STOCKING ENGINE CONTROLS */}
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Settings size={20} color="var(--accent-color)" />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Automatic Stock Replenishment</h4>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Purchases automatically when low</p>
              </div>
            </div>
            
            {/* Toggle switch slider wrapper */}
            <div 
              onClick={() => toggleAutoStock(!state.isAutoStockEnabled)}
              style={{
                width: '46px',
                height: '26px',
                borderRadius: '13px',
                background: state.isAutoStockEnabled ? 'var(--success-color)' : 'rgba(255,255,255,0.1)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              <div 
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: '3px',
                  left: state.isAutoStockEnabled ? '23px' : '3px',
                  transition: 'left 0.2s ease'
                }}
              ></div>
            </div>
          </div>

          {/* INVENTORY LIST */}
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Ingredient Stocks
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
            {Object.values(state.inventory).map((inv) => {
              const stockPct = getStockPercentage(inv.stock, inv.threshold);
              const barColor = getStockColor(inv.stock, inv.threshold);

              return (
                <div key={inv.id} className="glass-card" style={{ margin: '0', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{inv.name}</h4>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        Warning limit: {inv.threshold} units
                      </span>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: barColor }}>{inv.stock}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}> units</span>
                    </div>
                  </div>

                  {/* Stock progress level bar */}
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ height: '100%', width: `${stockPct}%`, background: barColor, borderRadius: '3px', transition: 'width 0.3s ease' }}></div>
                  </div>

                  {/* Restock action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Cost: ${inv.costPerUnit.toFixed(2)}/unit
                    </span>
                    <button
                      onClick={() => restockIngredient(inv.id, inv.restockQuantity)}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      Buy +{inv.restockQuantity} (${(inv.restockQuantity * inv.costPerUnit).toFixed(2)})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* LEDGER TRANSACTION LOG */}
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Store Ledger Log
          </h3>
          <div className="glass-card" style={{ padding: '0 16px', background: 'rgba(255,255,255,0.01)', maxHeight: '300px', overflowY: 'auto' }}>
            {state.ledger.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                No ledger logs found.
              </p>
            ) : (
              [...state.ledger].reverse().map((log) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)', fontSize: '12px' }}>
                  <div>
                    <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{log.description}</p>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span style={{ fontWeight: '700', color: log.amount >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                    {log.amount >= 0 ? '+' : ''}${log.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
