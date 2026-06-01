const InventoryLog = require('../models/InventoryLog');

/**
 * Write an inventory log entry. Designed to be called inside a Mongo
 * transaction (pass `session`) or standalone.
 *
 * Required fields:
 *   product (Product document or plain object with _id, productName, sku)
 *   type     ('system' | 'manual')
 *   reason   (see InventoryLog.LOG_REASONS)
 *   change   (signed number; + means stock in, − means stock out)
 *   stockBefore, stockAfter (non-negative numbers)
 *
 * Optional: relatedOrder, notes, createdBy, session.
 */
const writeInventoryLog = async ({
  product,
  type,
  reason,
  change,
  stockBefore,
  stockAfter,
  relatedOrder = null,
  notes = '',
  createdBy = null,
  session,
}) => {
  if (!product || !product._id) throw new Error('writeInventoryLog: product is required');

  const doc = {
    product: product._id,
    productName: product.productName,
    sku: product.sku,
    type,
    reason,
    change,
    stockBefore,
    stockAfter,
    relatedOrder,
    notes: notes ? String(notes).trim() : '',
    createdBy,
  };

  const opts = session ? { session } : undefined;
  const [created] = await InventoryLog.create([doc], opts);
  return created;
};

module.exports = { writeInventoryLog };
