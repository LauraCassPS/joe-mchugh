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
  const { publishableKey, postage, required } = await response.json();
  const stripe = window.Stripe(publishableKey);
  const form = element('address');
  const countrySelect = element('country');
  const countryNames = new Intl.DisplayNames(['en-IE'], { type: 'region' });
  const destinations = Object.keys(postage).map(code => [code, countryNames.of(code)]);
  destinations.sort((a, b) => a[1].localeCompare(b[1], 'en'));
  for (const [code, name] of destinations) countrySelect.add(new Option(name, code));
  countrySelect.value = 'IE';
  function updateAddressLabels() {
    const code = countrySelect.value;
    const labels = {
      city: 'Town or city',
      state: ({ IE: 'County', GB: 'County', US: 'State', AU: 'State or territory', CA: 'Province or territory', MY: 'State' })[code] || 'State, province or region',
      postal_code: ({ IE: 'Eircode', GB: 'Postcode', US: 'ZIP code', AU: 'Postcode' })[code] || 'Postal code',
    };
    for (const [field, label] of Object.entries(labels)) {
      const input = element(field);
      input.required = required[code].includes(field);
      input.labels[0].textContent = label;
      if (!input.required) {
        const optional = document.createElement('small');
        optional.textContent = ' (optional)';
        input.labels[0].append(optional);
      }
    }
  }
  function showTotal() {
    const subtotal = Number(quantity.value) * 2000;
    const rate = postage[countrySelect.value];
    element('subtotal').textContent = euro(subtotal);
    element('postage').textContent = rate === undefined ? 'Choose a country' : euro(rate);
    element('total').textContent = rate === undefined ? '—' : euro(subtotal + rate);
  }
  quantity.addEventListener('change', showTotal);
  countrySelect.addEventListener('change', () => {
    updateAddressLabels();
    showTotal();
  });
  element('delivery').hidden = false;
  statusMessage.textContent = '';
  updateAddressLabels();
  showTotal();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (element('continue').disabled) return;
    const data = new FormData(form);
    const { name, ...addressFields } = Object.fromEntries(
      Array.from(data.entries(), ([key, value]) => [key, value.trim()])
    );
    const value = { name, address: addressFields };
    const missing = ['name', ...required[countrySelect.value]].find(key => !String(data.get(key) || '').trim());
    if (missing) {
      element(missing).focus();
      statusMessage.textContent = 'Please complete the delivery address.';
      return;
    }
    element('continue').disabled = true;
    quantity.disabled = true;
    try {
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
          quantity.disabled = true;
          statusMessage.textContent = 'Test payment complete. Your order is recorded in the Só Coaching Stripe sandbox.';
          statusMessage.focus();
        },
      });
      const destination = value.address;
      element('shipping-summary').textContent = 'Deliver to ' +
        [value.name, destination.line1, destination.line2, destination.city, destination.state, destination.postal_code, countryNames.of(destination.country)].filter(Boolean).join(', ');
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
      quantity.disabled = false;
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
