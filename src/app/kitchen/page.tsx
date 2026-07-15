'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Flame, Clock, ChevronRight, LogOut, CheckSquare, Coffee, RotateCcw, AlertTriangle, X 
} from 'lucide-react';
import { useRestaurant, Order, OrderStatus } from '@/context/RestaurantContext';

export default function KitchenPage() {
  const router = useRouter();
  const { state, updateOrderStatus } = useRestaurant();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Sync KDS orders list - show only active kitchen orders
  const activeOrders = state.orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  );

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      alert('Failed to log out cleanly.');
    }
  };

  // Helper to determine status badges
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'received':
        return <span style={{ background: 'var(--accent-glow)', color: 'var(--accent-color)', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px' }}>PENDING</span>;
      case 'preparing':
        return <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px' }}>COOKING</span>;
      case 'ready':
        return <span style={{ background: 'var(--success-glow)', color: 'var(--success-color)', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px' }}>READY</span>;
      default:
        return null;
    }
  };

  return (
    <div className="device-container">
      {/* Back to Customer view switch */}
      <button className="role-switch-badge" onClick={() => router.push('/')}>
        🍽️ Customer Site
      </button>

      <div className="smartphone-frame">
        {/* Header */}
        <div className="screen-header">
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Kitchen Screen
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--accent-color)' }}>KDS Monitor</h1>
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

        {/* Screen Scroll Container */}
        <div className="screen-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Active Tickets ({activeOrders.length})
            </h3>
            
            {/* Low ingredient alert banner inside kitchen */}
            {Object.values(state.inventory).some(inv => inv.stock <= inv.threshold) && (
              <span style={{ color: 'var(--danger-color)', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> Low Stock Alert
              </span>
            )}
          </div>

          {activeOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <CheckSquare size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <h4 style={{ color: 'var(--text-primary)', fontWeight: '700' }}>All Clear!</h4>
              <p style={{ fontSize: '12px', marginTop: '6px' }}>No orders currently in the queue. New orders from clients will appear here automatically.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="glass-card"
                  onClick={() => setSelectedOrder(order)}
                  style={{ 
                    padding: '16px',
                    borderColor: selectedOrder?.id === order.id ? 'var(--accent-color)' : 'var(--border-color)',
                    background: selectedOrder?.id === order.id ? '#FFFFFF' : 'var(--bg-card)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{order.orderNumber}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px', marginLeft: '8px' }}>
                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Items list summary */}
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    {order.items.map((item) => (
                      <div key={item.menuItemId} style={{ padding: '3px 0' }}>
                        <span style={{ color: 'var(--accent-color)', fontWeight: '700' }}>{item.quantity}x</span> {item.name}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)', background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span>Fulfillment:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {order.fulfillmentType === 'dine_in' && `Table ${order.fulfillmentDetails.tableNumber}`}
                      {order.fulfillmentType === 'takeaway' && `Counter (${order.fulfillmentDetails.pickupTime})`}
                      {order.fulfillmentType === 'curbside' && `Curbside (${order.fulfillmentDetails.licensePlate})`}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Order Cook Sheet Slide-up Drawer */}
        {selectedOrder && (
          <div className="drawer-backdrop" onClick={() => setSelectedOrder(null)}>
            <div className="drawer-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-handle"></div>
              
              <div className="drawer-header">
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Ticket {selectedOrder.orderNumber}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    Fulfillment: {selectedOrder.fulfillmentType.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="drawer-body">
                <h4 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Ingredients assembly
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedOrder.items.map((item) => {
                    const menuItem = state.menu.find(m => m.id === item.menuItemId);
                    return (
                      <div key={item.menuItemId} style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>
                          <span>{item.name}</span>
                          <span style={{ color: 'var(--accent-color)' }}>x{item.quantity}</span>
                        </div>
                        
                        {/* Recipe list */}
                        {menuItem && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Required Ingredients:</p>
                            {menuItem.recipe.map(r => {
                              const ingredient = state.inventory[r.ingredientId];
                              return (
                                <div key={r.ingredientId} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                  <span>- {ingredient?.name}</span>
                                  <span>{r.quantity * item.quantity} {r.ingredientId === 'paneer' || r.ingredientId === 'potatoes' || r.ingredientId === 'butter' || r.ingredientId === 'tea_leaves' || r.ingredientId === 'sugar' ? 'g' : r.ingredientId === 'batter' || r.ingredientId === 'mango' || r.ingredientId === 'milk' ? 'ml' : 'units'}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ticket Action controls */}
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedOrder.status === 'received' && (
                    <button 
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'preparing');
                        setSelectedOrder(null);
                      }} 
                      className="btn btn-primary"
                    >
                      <Flame size={18} />
                      Start Cooking
                    </button>
                  )}

                  {selectedOrder.status === 'preparing' && (
                    <button 
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'ready');
                        setSelectedOrder(null);
                      }} 
                      className="btn btn-primary"
                      style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.2)' }}
                    >
                      <CheckSquare size={18} />
                      Mark Ready for Pickup
                    </button>
                  )}

                  {selectedOrder.status === 'ready' && (
                    <button 
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'completed');
                        setSelectedOrder(null);
                      }} 
                      className="btn btn-primary"
                      style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.2)' }}
                    >
                      <CheckSquare size={18} />
                      Serve / Complete Ticket
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'cancelled');
                      setSelectedOrder(null);
                    }} 
                    className="btn btn-danger"
                  >
                    Cancel & Refund Order (₹{selectedOrder.total.toFixed(2)})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
