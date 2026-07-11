const Stripe = require('stripe');
const { getStripeSecretKey } = require('./env');

let stripe;

function getStripeClient() {
    if (!stripe) {
        const key = getStripeSecretKey();
        if (key) {
            stripe = new Stripe(key);
        }
    }
    return stripe;
}

module.exports = { getStripeClient };
