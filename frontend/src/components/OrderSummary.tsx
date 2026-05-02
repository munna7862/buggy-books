import React from 'react';

// Define the custom element for Shadow DOM encapsulation
class OrderSummaryElement extends HTMLElement {
  static get observedAttributes() {
    return ['total'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'total' && oldValue !== newValue && this.shadowRoot) {
      const span = this.shadowRoot.querySelector('.total-amount');
      if (span) {
        span.textContent = `$${newValue}`;
      } else {
        this.render();
      }
    }
  }

  render() {
    const total = this.getAttribute('total') || '0.00';
    if (!this.shadowRoot) return;
    
    this.shadowRoot.innerHTML = `
      <style>
        .summary-box {
          padding: 15px;
          border: 2px dashed #999;
          background: var(--code-bg, #f9f9f9);
          margin-bottom: 20px;
          border-radius: 4px;
          color: var(--text);
        }
        .total-amount { 
          font-weight: bold; 
          font-size: 1.2em; 
          color: var(--text-h, #2c3e50); 
        }
      </style>
      <div class="summary-box">
        <h3>Secure Order Summary</h3>
        <p>Total to pay: <span class="total-amount">$${total}</span></p>
      </div>
    `;
  }
}

// Register it only once
if (!customElements.get('order-summary-box')) {
  customElements.define('order-summary-box', OrderSummaryElement);
}

export default function OrderSummary({ total }: { total: number }) {
  return React.createElement('order-summary-box', { total: total.toFixed(2) });
}
