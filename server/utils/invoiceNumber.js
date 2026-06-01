const Counter = require('../models/Counter');

/**
 * Atomically generate the next invoice number for the given year.
 * Format: INV-YYYY-NNN (zero-padded to 3 digits, grows as needed).
 *
 * Safe to call inside a Mongo transaction — findOneAndUpdate is atomic per
 * document and works under transactions on replica-set deployments (Atlas).
 */
const generateInvoiceNumber = async (date = new Date(), session) => {
  const year = date.getUTCFullYear();
  const id = `invoice-${year}`;

  const opts = {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  };
  if (session) opts.session = session;

  const counter = await Counter.findOneAndUpdate(
    { _id: id },
    { $inc: { seq: 1 } },
    opts
  );

  const padded = String(counter.seq).padStart(3, '0');
  return `INV-${year}-${padded}`;
};

module.exports = { generateInvoiceNumber };
