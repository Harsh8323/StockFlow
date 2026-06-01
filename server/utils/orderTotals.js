/**
 * Round to 2 decimal places without binary-floating-point surprises.
 */
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Compute order totals from priced items + GST + discount.
 *
 * @param {Array<{ unitPrice: number, quantity: number }>} items
 * @param {number} gstRate     — percentage, e.g. 18 for 18%
 * @param {number} discount    — flat amount in rupees, applied after GST
 * @returns {{ subtotal, gstAmount, discount, totalAmount, lineTotals }}
 */
const computeOrderTotals = (items, gstRate = 18, discount = 0) => {
  const safeRate = Math.max(0, Math.min(100, Number(gstRate) || 0));
  const safeDiscount = Math.max(0, Number(discount) || 0);

  const lineTotals = items.map((it) => round2(Number(it.unitPrice) * Number(it.quantity)));
  const subtotal = round2(lineTotals.reduce((s, n) => s + n, 0));
  const gstAmount = round2(subtotal * (safeRate / 100));
  const cappedDiscount = Math.min(safeDiscount, round2(subtotal + gstAmount));
  const totalAmount = round2(subtotal + gstAmount - cappedDiscount);

  return {
    subtotal,
    gstAmount,
    discount: cappedDiscount,
    totalAmount,
    lineTotals,
  };
};

/**
 * Derive payment status from amount paid vs total.
 */
const derivePaymentStatus = (amountPaid, totalAmount) => {
  const paid = Math.max(0, Number(amountPaid) || 0);
  const total = Math.max(0, Number(totalAmount) || 0);
  if (paid <= 0) return 'unpaid';
  if (paid + 0.001 < total) return 'partial';
  return 'paid';
};

module.exports = { computeOrderTotals, derivePaymentStatus, round2 };
