'use strict';

const statusMessage = document.getElementById('checkout-status');
const retry = document.getElementById('retry');

async function sendToCheckout(fields) {
  const response = await fetch('/api/book/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!response.ok) throw new Error('Checkout request failed');
  return response.json();
}

async function startCheckout() {
  try {
    if (!window.Stripe) throw new Error('Stripe has not loaded');
    const { publishableKey, clientSecret } = await sendToCheckout({ action: 'start' });
    const stripe = window.Stripe(publishableKey);
    // Apply edits in order, including when someone changes countries twice quickly.
    let pendingUpdate = Promise.resolve();
    const checkout = await stripe.initEmbeddedCheckout({
      clientSecret,
      onShippingDetailsChange({ checkoutSessionId, shippingDetails }) {
        pendingUpdate = pendingUpdate.then(async () => {
          try {
            await sendToCheckout({ action: 'shipping', sessionId: checkoutSessionId, clientSecret, shippingDetails });
            return { type: 'accept' };
          } catch {
            return { type: 'reject', errorMessage: 'Postage could not be updated. Please check your delivery address and try again.' };
          }
        });
        return pendingUpdate;
      },
      onComplete() {
        checkout.destroy();
        statusMessage.textContent = 'Test payment complete. Your order is recorded in the Só Coaching Stripe sandbox.';
        statusMessage.focus();
      },
    });
    checkout.mount('#checkout');
    statusMessage.textContent = '';
  } catch {
    statusMessage.textContent = 'Secure checkout could not open. Please try again.';
    retry.hidden = false;
  }
}

retry.addEventListener('click', () => window.location.reload());
startCheckout();
