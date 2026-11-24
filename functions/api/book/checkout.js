// Destinations selected in the book's Stripe shipping settings, grouped as in the Dashboard.
const europe = new Set('AX AL AD AT BY BE BA BG HR CZ DK EE FO FI FR DE GI GR GG HU IS IE IM IT JE XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SJ SE CH UA GB VA'.split(' '));
const countries = new Set([
  ...europe,
  ...'CA MX PR US AI AG AW BS BB BZ BM BQ VG KY CR CW DM DO SV GL GD GP GT HT HN JM MQ MS NI PA SX BL KN LC MF PM VC TT TC AR BO BV BR CL CO EC FK GF GY PY PE GS SR UY VE'.split(' '),
  ...'DZ AO BJ BW IO BF BI CM CV CF TD KM CG CD CI DJ EG GQ ER SZ ET TF GA GM GH GN GW KE LS LR LY MG MW ML MR MU YT MA MZ NA NE NG RE RW ST SN SC SL SO ZA SS SH TZ TG TA TN UG ZM ZW'.split(' '),
  ...'AF AM AZ BH BD BT BN KH CN CY GE HK IN ID IQ IL JP JO KZ KW KG LA LB MO MY MV MN MM NP OM PK PH QA SA SG KR LK TW TJ TH TL TR TM AE UZ VN YE'.split(' '),
  ...'AU CK FJ PF GU KI NR NC NZ NU PG PN WS SB TK TO TV VU WF'.split(' '),
]);

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

async function stripe(env, path, fields) {
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions' + path, {
    method: fields ? 'POST' : 'GET',
    headers: {
      Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY,
      'Stripe-Version': '2025-09-30.clover',
    },
    body: fields ? new URLSearchParams(fields) : undefined,
  });
  if (!response.ok) {
    const error = await response.json();
    console.error('Book checkout', response.status, error.error?.code, error.error?.param, response.headers.get('request-id'));
    throw new Error('Stripe request failed');
  }
  return response.json();
}

async function createSession(env) {
  const fields = {
    mode: 'payment',
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    currency: 'eur',
    'adaptive_pricing[enabled]': 'false',
    'payment_method_types[0]': 'card',
    'line_items[0][price]': env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    'line_items[0][adjustable_quantity][enabled]': 'true',
    'line_items[0][adjustable_quantity][minimum]': '1',
    'line_items[0][adjustable_quantity][maximum]': '2',
    'custom_fields[0][key]': 'dedication',
    'custom_fields[0][label][type]': 'custom',
    'custom_fields[0][label][custom]': 'Dedication for your signed book(s)',
    'custom_fields[0][type]': 'text',
    'custom_fields[0][optional]': 'true',
    'permissions[update_shipping_details]': 'server_only',
    'metadata[order_type]': 'signed_book',
  };
  Array.from(countries).forEach((country, i) => {
    fields['shipping_address_collection[allowed_countries][' + i + ']'] = country;
  });
  const session = await stripe(env, '', fields);
  return reply({ publishableKey: env.STRIPE_PUBLISHABLE_KEY, clientSecret: session.client_secret });
}

async function updatePostage(env, body) {
  const { sessionId, clientSecret, shippingDetails } = body;
  const address = shippingDetails?.address;
  if (typeof sessionId !== 'string' || !/^cs_test_[a-zA-Z0-9]+$/.test(sessionId) ||
      typeof clientSecret !== 'string' || !countries.has(address?.country) ||
      typeof shippingDetails.name !== 'string' || !shippingDetails.name.trim() ||
      typeof address.line1 !== 'string' || !address.line1.trim()) {
    return reply({ error: 'Enter a complete delivery address.' }, 400);
  }
  const path = '/' + sessionId;
  const session = await stripe(env, path);
  if (session.client_secret !== clientSecret || session.metadata?.order_type !== 'signed_book' || session.status !== 'open') {
    return reply({ error: 'Reopen checkout to update your address.' }, 403);
  }
  // Persist the address and its matching rate in the same Stripe update.
  const prefix = 'collected_information[shipping_details]';
  const fields = {
    [prefix + '[name]']: shippingDetails.name,
    ...shippingRate(postage(address.country), 'Book postage'),
  };
  for (const key of ['country', 'line1', 'line2', 'city', 'state', 'postal_code']) {
    fields[prefix + '[address][' + key + ']'] = address[key] || '';
  }
  await stripe(env, path, fields);
  return reply({ updated: true });
}

export async function onRequestPost({ env, request }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) return reply({}, 403);
  if (!env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || !env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') || !env.STRIPE_PRICE_ID) {
    return reply({ error: 'Test checkout is unavailable.' }, 503);
  }
  const body = await request.json().catch(() => null);
  try {
    if (body?.action === 'start') return await createSession(env);
    if (body?.action === 'shipping') return await updatePostage(env, body);
    return reply({}, 400);
  } catch {
    return reply({ error: 'Checkout could not reach Stripe. Please try again.' }, 502);
  }
}
