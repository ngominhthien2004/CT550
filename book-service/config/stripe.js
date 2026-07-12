const Stripe = require('stripe');
const { getStripeSecretKey } = require('./env');

const key = getStripeSecretKey();
const stripe = key ? new Stripe(key) : null;

module.exports = stripe;
