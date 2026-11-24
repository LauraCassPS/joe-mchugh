'use strict';

const element = id => document.getElementById(id);
const quantity = element('quantity');
const statusMessage = element('checkout-status');
const euro = cents => '€' + (cents / 100).toFixed(2);
let checkout;

async function startCheckout() {
  if (!window.Stripe) throw new Error();
  const endpoint = '/api/book/checkout';
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error();
  const { publishableKey, postage } = await response.json();
  const stripe = window.Stripe(publishableKey);
  const address = stripe.elements().create('address', {
    mode: 'shipping',
    allowedCountries: Object.keys(postage),
    defaultValues: { address: { country: 'IE' } },
  });
  let country = 'IE';
  function showTotal() {
    const subtotal = Number(quantity.value) * 2000;
    const rate = postage[country];
    element('total').textContent = rate === undefined ? 'Choose a delivery country to see postage.' :
      'Books ' + euro(subtotal) + ' + postage ' + euro(rate) + ' = ' + euro(subtotal + rate);
  }
  quantity.addEventListener('change', showTotal);
  address.on('change', event => {
    country = event.value.address.country;
    showTotal();
  });
  address.on('ready', () => {
    statusMessage.textContent = '';
    element('continue').disabled = false;
  });
  element('delivery').hidden = false;
  element('continue').disabled = true;
  address.mount('#address');
  showTotal();

  element('continue').addEventListener('click', async () => {
    element('continue').disabled = true;
    try {
      const { complete, value } = await address.getValue();
      if (!complete) {
        statusMessage.textContent = 'Please complete the delivery address.';
        address.focus();
        return;
      }
      const copies = Number(quantity.value);
      element('delivery').hidden = true;
      statusMessage.textContent = 'Opening secure payment…';
      const result = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: copies, shipping: value }),
      });
      if (!result.ok) throw new Error();
      const { clientSecret } = await result.json();
      checkout = await stripe.initEmbeddedCheckout({
        clientSecret,
        onComplete() {
          checkout.destroy();
          element('payment').hidden = true;
          statusMessage.textContent = 'Test payment complete. Your order is recorded in the Só Coaching Stripe sandbox.';
          statusMessage.focus();
        },
      });
      const destination = value.address;
      element('shipping-summary').textContent = 'Deliver to ' +
        [value.name, destination.line1, destination.line2, destination.city, destination.state, destination.postal_code, destination.country].filter(Boolean).join(', ');
      element('payment').hidden = false;
      checkout.mount('#checkout');
      statusMessage.textContent = '';
      element('edit').focus();
    } catch {
      if (checkout) { checkout.destroy(); checkout = undefined; }
      element('payment').hidden = true;
      element('delivery').hidden = false;
      statusMessage.textContent = 'The payment form could not open. Please try again.';
      statusMessage.focus();
    } finally {
      element('continue').disabled = false;
    }
  });
  element('edit').addEventListener('click', () => {
    checkout.destroy();
    checkout = undefined;
    element('payment').hidden = true;
    element('delivery').hidden = false;
    quantity.focus();
  });
}

element('retry').addEventListener('click', () => window.location.reload());
startCheckout().catch(() => {
  statusMessage.textContent = 'Test checkout could not open. Please try again.';
  element('retry').hidden = false;
});
