import React from 'react';

// Define the custom element for Shadow DOM encapsulation
class OrderSummaryElement extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });
    const total = this.getAttribute('total') || '0.00';
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <style>
        .summary-box {
          padding: 15px;
          border: 2px dashed #999;
          background: #f9f9f9;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .total-amount { 
          font-weight: bold; 
          font-size: 1.2em; 
          color: #2c3e50; 
        }
      </style>
      <div class="summary-box">
        <h3>Secure Order Summary</h3>
        <p>Total to pay: <span class="total-amount">$${total}</span></p>
      </div>
    `;
    shadow.appendChild(wrapper);
  }
}

// Register it only once
if (!customElements.get('order-summary-box')) {
  customElements.define('order-summary-box', OrderSummaryElement);
}

export default function OrderSummary({ total }: { total: number }) {
  return React.createElement('order-summary-box', { total: total.toFixed(2) });
}
