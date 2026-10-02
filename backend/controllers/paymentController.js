const crypto = require("crypto");
const Razorpay = require("razorpay");
const { RiceProduct } = require("../models");
const { success, error } = require("../utils/response");
const { isPositiveInteger } = require("../utils/validators");

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

async function createPaymentOrder(req, res, next) {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return error(res, 503, "Online payment is not configured");

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) return error(res, 400, "Payment needs at least one item");

    let totalAmount = 0;
    for (const item of items) {
      if (!isPositiveInteger(item.rice_product_id) || !isPositiveInteger(item.quantity)) {
        return error(res, 400, "Each payment item needs a valid product and quantity");
      }
      const riceProduct = await RiceProduct.findByPk(item.rice_product_id);
      if (!riceProduct || riceProduct.status !== "active") return error(res, 404, "Rice product is not available");
      totalAmount += Number(riceProduct.price_per_bag) * item.quantity;
    }

    const paymentOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `rice_${req.user.id}_${Date.now()}`,
    });

    return success(res, 201, "Payment order created", {
      id: paymentOrder.id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
}

async function verifyPayment(req, res, next) {
  try {
    const razorpay = getRazorpay();
    if (!razorpay) return error(res, 503, "Online payment is not configured");

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return error(res, 400, "Incomplete payment verification details");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) return error(res, 400, "Payment signature is invalid");

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.order_id !== razorpay_order_id || payment.status !== "captured") {
      return error(res, 400, "Payment has not been captured");
    }

    return success(res, 200, "Payment verified successfully", {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: payment.status,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPaymentOrder, verifyPayment };