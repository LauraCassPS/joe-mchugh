// Destinations selected in the book's Stripe shipping settings, grouped as in the Dashboard.
const europe = new Set('AX AL AD AT BY BE BA BG HR CZ DK EE FO FI FR DE GI GR GG HU IS IE IM IT JE XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SJ SE CH UA GB VA'.split(' '));
const countries = new Set([
  ...europe,
  ...'CA MX PR US AI AG AW BS BB BZ BM BQ VG KY CR CW DM DO SV GL GD GP GT HT HN JM MQ MS NI PA SX BL KN LC MF PM VC TT TC AR BO BV BR CL CO EC FK GF GY PY PE GS SR UY VE'.split(' '),
  ...'DZ AO BJ BW IO BF BI CM CV CF TD KM CG CD CI DJ EG GQ ER SZ ET TF GA GM GH GN GW KE LS LR LY MG MW ML MR MU YT MA MZ NA NE NG RE RW ST SN SC SL SO ZA SS SH TZ TG TA TN UG ZM ZW'.split(' '),
  ...'AF AM AZ BH BD BT BN KH CN CY GE HK IN ID IQ IL JP JO KZ KW KG LA LB MO MY MV MN MM NP OM PK PH QA SA SG KR LK TW TJ TH TL TR TM AE UZ VN YE'.split(' '),
  ...'AU CK FJ PF GU KI NR NC NZ NU PG PN WS SB TK TO TV VU WF'.split(' '),
]);

// Postal field requirements follow libaddressinput's region metadata.
const optionalCity = new Set('AE AG CO GI HK ID JP KY MO NR SG SM VG VN'.split(' '));
const requiredRegion = new Set('AE AS AU BR CA CN CO CR ES FM HK HN ID IN IQ IT JM JP KN KR KY MH MP MX NR PF PG PW RU SO SV TW UM US VE VI VN MY'.split(' '));
const requiredPostcode = new Set('AS AT AU AX BE BL BR CA CH CN CZ DE DK EE ES FI FK FM FR GB GF GG GL GP GR GS GU HU IM IN IO IT JE JP KR LI LT LU LV MF MH MP MQ MX MY NC NL NO NZ PF PL PM PN PR PT PW RE RO RU SE SG SH SJ SK SM TC TR TW UA US VI WF YT ZA'.split(' '));

function requiredFields(country) {
  const fields = ['line1'];
  if (!optionalCity.has(country)) fields.push('city');
  if (requiredRegion.has(country)) fields.push('state');
  if (requiredPostcode.has(country)) fields.push('postal_code');
  return fields;
}

function postage(country) {
  if (country === 'IE') return 700;
  if (country === 'GB') return 1000;
  if (europe.has(country)) return 1200;
  if (country === 'US' || country === 'CA') return 1800;
  return 2500;
}

function shippingRate(amount, label) {
  const rate = 'shipping_options[0][shipping_rate_data]';
  return {
    [rate + '[type]']: 'fixed_amount',
    [rate + '[display_name]']: label,
    [rate + '[fixed_amount][currency]']: 'eur',
    [rate + '[fixed_amount][amount]']: String(amount),
  };
}

function reply(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function configured(env) {
  return env.STRIPE_SECRET_KEY?.startsWith('sk_test_') &&
    env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') && env.STRIPE_PRICE_ID;
}

export function onRequestGet({ env }) {
  if (!configured(env)) return reply({ error: 'Test checkout is unavailable.' }, 503);
  return reply({
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    postage: Object.fromEntries(Array.from(countries, country => [country, postage(country)])),
    required: Object.fromEntries(Array.from(countries, country => [country, requiredFields(country)])),
  });
}

export async function onRequestPost({ env, request }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) return reply({}, 403);
  if (!configured(env)) return reply({ error: 'Test checkout is unavailable.' }, 503);
  const body = await request.json().catch(() => null);
  const { quantity, shipping } = body || {};
  const address = shipping?.address;
  if (![1, 2].includes(quantity) || !countries.has(address?.country) ||
      typeof shipping.name !== 'string' || !shipping.name.trim() ||
      requiredFields(address.country).some(field => typeof address[field] !== 'string' || !address[field].trim())) {
    return reply({ error: 'Complete the delivery address before continuing.' }, 400);
  }
  // One session fixes the book quantity, delivery address and matching postage together.
  const fields = {
    mode: 'payment',
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    currency: 'eur',
    'adaptive_pricing[enabled]': 'false',
    'payment_method_types[0]': 'card',
    'line_items[0][price]': env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': String(quantity),
    'custom_fields[0][key]': 'dedication',
    'custom_fields[0][label][type]': 'custom',
    'custom_fields[0][label][custom]': 'Dedication for your signed book(s)',
    'custom_fields[0][type]': 'text',
    'custom_fields[0][optional]': 'true',
    'payment_intent_data[shipping][name]': shipping.name,
    'metadata[order_type]': 'signed_book',
    ...shippingRate(postage(address.country), 'Book postage'),
  };
  for (const key of ['country', 'line1', 'line2', 'city', 'state', 'postal_code']) {
    if (typeof address[key] === 'string' && address[key]) {
      fields['payment_intent_data[shipping][address][' + key + ']'] = address[key];
    }
  }
  const result = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'Stripe-Version': '2025-09-30.clover' },
    body: new URLSearchParams(fields),
  });
  const session = await result.json();
  if (!result.ok) {
    console.error('Book checkout', result.status, session.error?.code, session.error?.param, result.headers.get('request-id'));
    return reply({ error: 'Stripe could not open the payment form.', parameter: session.error?.param, code: session.error?.code }, 502);
  }
  if (session.livemode || session.currency !== 'eur' ||
      session.amount_total !== quantity * 2000 + postage(address.country)) {
    return reply({ error: 'The Stripe price differs from the displayed total.' }, 409);
  }
  return reply({ clientSecret: session.client_secret });
}
