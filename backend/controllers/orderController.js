const { sequelize, Order, OrderItem, RiceProduct, User } = require("../models");
const { success, error } = require("../utils/response");
const { isPositiveInteger, isNonEmptyString } = require("../utils/validators");
const { notifyFarmerNewOrder } = require("../services/whatsappService");
const transporter = require("../config/email");

async function sendOrderCancellationEmail({ email, orderId, totalAmount }) {
  if (!email) return;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Order was canceled",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #166534;">Order was canceled</h2>
          <p>Hello,</p>
          <p>Your order <strong>#${orderId}</strong> has been canceled successfully.</p>
          <p>Refund / order total: <strong>₹${Number(totalAmount).toFixed(2)}</strong></p>
          <p>If this was not done by you, please contact support immediately.</p>
        </div>
      `,
    });
  } catch (mailErr) {
    console.error("Order cancellation email failed:", mailErr.message);
  }
}

async function sendOrderConfirmationEmail({ email, customerName, orderId, totalAmount, items, deliveryAddress }) {
  if (!email) return;

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${item.riceName}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(item.pricePerBag * item.quantity).toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Rice booking confirmed - Order #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
          <h2 style="color: #166534;">Rice booking confirmed!</h2>
          <p>Hello ${customerName || "Customer"},</p>
          <p>Your order <strong>#${orderId}</strong> has been successfully placed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr>
                <th style="padding: 8px 0; text-align: left; border-bottom: 2px solid #166534;">Rice</th>
                <th style="padding: 8px 0; text-align: center; border-bottom: 2px solid #166534;">Bags</th>
                <th style="padding: 8px 0; text-align: right; border-bottom: 2px solid #166534;">Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <p><strong>Total: ₹${Number(totalAmount).toFixed(2)}</strong></p>
          <p><strong>Delivery address:</strong><br />${deliveryAddress}</p>
          <p>We will keep you updated as your order moves through delivery.</p>
        </div>
      `,
    });
  } catch (mailErr) {
    console.error("Order confirmation email failed:", mailErr.message);
  }
}

// POST /api/orders (customer only)
//
// This is the most important endpoint in the app for data integrity.
// It wraps everything in a single MySQL transaction and takes a row-level
// lock (SELECT ... FOR UPDATE) on every rice product being purchased.
// That means if two customers try to buy the last bags at the same moment,
// the second transaction blocks on the lock until the first commits, then
// re-reads the now-updated quantity and correctly gets rejected. Quantity
// can never go negative and no order can ever be created against stock
// that no longer exists.
async function createOrder(req, res, next) {
  const {
    items,
    payment_method = "cod",
    delivery_name,
    delivery_phone,
    alternate_phone,
    delivery_address,
    delivery_city,
    delivery_state,
    delivery_pincode,
  } = req.body;

  if (!['cod', 'upi'].includes(payment_method)) return error(res, 400, "Payment method must be cash or UPI");
  if (!isNonEmptyString(delivery_name)) return error(res, 400, "Delivery name is required");
  if (!isNonEmptyString(delivery_phone)) return error(res, 400, "Delivery phone is required");
  if (!isNonEmptyString(delivery_address)) return error(res, 400, "Delivery address is required");
  if (!isNonEmptyString(delivery_city)) return error(res, 400, "Delivery city is required");
  if (!isNonEmptyString(delivery_state)) return error(res, 400, "Delivery state is required");
  if (!isNonEmptyString(delivery_pincode)) return error(res, 400, "Delivery pincode is required");

  if (!Array.isArray(items) || items.length === 0) {
    return error(res, 400, "Order must contain at least one item");
  }

  for (const item of items) {
    if (!isPositiveInteger(item.rice_product_id) || !isPositiveInteger(item.quantity)) {
      return error(res, 400, "Each item needs a valid rice_product_id and a positive quantity");
    }
  }

  // All rice products in one order must belong to the same farmer, since a
  // farmer needs a single, coherent list of orders to fulfil.
  let transaction;
  try {
    transaction = await sequelize.transaction();

    let farmerId = null;
    let totalAmount = 0;
    const preparedItems = [];
    const notificationItems = [];

    for (const item of items) {
      // Row-level lock: no other transaction can read/modify this row
      // until this transaction commits or rolls back.
      const riceProduct = await RiceProduct.findByPk(item.rice_product_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!riceProduct || riceProduct.status !== "active") {
        await transaction.rollback();
        return error(res, 404, `Rice product #${item.rice_product_id} is not available`);
      }

      if (farmerId === null) {
        farmerId = riceProduct.farmer_id;
      } else if (farmerId !== riceProduct.farmer_id) {
        await transaction.rollback();
        return error(res, 400, "All items in one order must be from the same farmer");
      }

      // The real-time check that prevents overselling.
      if (riceProduct.quantity_available < item.quantity) {
        await transaction.rollback();
        return error(
          res,
          400,
          `Only ${riceProduct.quantity_available} bag(s) of ${riceProduct.name} left. Someone may have just purchased the rest.`
        );
      }

      // Price ALWAYS comes from the database, never from the request body.
      const pricePerBag = Number(riceProduct.price_per_bag);
      const subtotal = pricePerBag * item.quantity;
      totalAmount += subtotal;

      riceProduct.quantity_available -= item.quantity;
      await riceProduct.save({ transaction });

      preparedItems.push({
        rice_product_id: riceProduct.id,
        quantity: item.quantity,
        price_per_bag: pricePerBag,
        subtotal,
      });

      notificationItems.push({
        riceName: riceProduct.name,
        quantity: item.quantity,
        pricePerBag,
      });
    }

    const order = await Order.create(
      {
        customer_id: req.user.id, // NEVER trust a customer_id from the request body
        farmer_id: farmerId,
        total_amount: totalAmount,
        payment_method,
        delivery_name,
        delivery_phone,
        alternate_phone,
        delivery_address,
        delivery_city,
        delivery_state,
        delivery_pincode,
        status: "accepted",
      },
      { transaction }
    );

    for (const item of preparedItems) {
      await OrderItem.create({ ...item, order_id: order.id }, { transaction });
    }

    await transaction.commit();

    await sendOrderConfirmationEmail({
      email: req.user.email,
      customerName: req.user.name,
      orderId: order.id,
      totalAmount: order.total_amount,
      items: notificationItems,
      deliveryAddress: `${delivery_address}, ${delivery_city}, ${delivery_state} - ${delivery_pincode}`,
    });

    // WhatsApp is sent AFTER commit, and its failure must never undo the order.
    const farmer = await User.findByPk(farmerId);
    const whatsappResult = await notifyFarmerNewOrder({
      order,
      farmer,
      customer: req.user,
      items: notificationItems,
    });
    if (!whatsappResult.ok) {
      console.warn(`[WhatsApp] Order #${order.id} was created but farmer notification failed: ${whatsappResult.reason}`);
    }

    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: "items", include: [{ model: RiceProduct, as: "riceProduct" }] }],
    });

    return success(res, 201, "Order created successfully", fullOrder);
  } catch (err) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(err);
  }
}

// GET /api/customer/orders (customer only - their own orders)
async function getCustomerOrders(req, res, next) {
  try {
    const orders = await Order.findAll({
      where: { customer_id: req.user.id },
      include: [
        { model: OrderItem, as: "items", include: [{ model: RiceProduct, as: "riceProduct" }] },
        { model: User, as: "farmer", attributes: ["id", "name", "phone"] },
      ],
      order: [["created_at", "DESC"]],
    });
    return success(res, 200, "Orders fetched successfully", orders);
  } catch (err) {
    next(err);
  }
}

// GET /api/farmer/orders (farmer only - orders placed against their rice)
async function getFarmerOrders(req, res, next) {
  try {
    const orders = await Order.findAll({
      where: { farmer_id: req.user.id },
      include: [
        { model: OrderItem, as: "items", include: [{ model: RiceProduct, as: "riceProduct" }] },
        { model: User, as: "customer", attributes: ["id", "name", "phone"] },
      ],
      order: [["created_at", "DESC"]],
    });
    return success(res, 200, "Orders fetched successfully", orders);
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/:id (owner customer OR owner farmer only - prevents IDOR)
async function getOrderById(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: OrderItem, as: "items", include: [{ model: RiceProduct, as: "riceProduct" }] },
        { model: User, as: "farmer", attributes: ["id", "name", "phone"] },
        { model: User, as: "customer", attributes: ["id", "name", "phone"] },
      ],
    });

    if (!order) return error(res, 404, "Order not found");

    const isOwner = order.customer_id === req.user.id || order.farmer_id === req.user.id;
    if (!isOwner) return error(res, 403, "You do not have access to this order");

    return success(res, 200, "Order fetched successfully", order);
  } catch (err) {
    next(err);
  }
}

// PUT /api/orders/:id/cancel (customer only, only while pending/accepted)
async function cancelOrder(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction });
    if (!order) {
      await transaction.rollback();
      return error(res, 404, "Order not found");
    }
    if (order.customer_id !== req.user.id) {
      await transaction.rollback();
      return error(res, 403, "You do not have access to this order");
    }
    if (!["pending", "accepted"].includes(order.status)) {
      await transaction.rollback();
      return error(res, 400, `Order cannot be cancelled once it is '${order.status}'`);
    }

    // Restore inventory for every item in the order.
    const items = await OrderItem.findAll({ where: { order_id: order.id }, transaction });
    for (const item of items) {
      const riceProduct = await RiceProduct.findByPk(item.rice_product_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (riceProduct) {
        riceProduct.quantity_available += item.quantity;
        await riceProduct.save({ transaction });
      }
    }

    order.status = "cancelled";
    await order.save({ transaction });

    await transaction.commit();

    await sendOrderCancellationEmail({
      email: req.user.email,
      orderId: order.id,
      totalAmount: order.total_amount,
    });

    return success(res, 200, "Order cancelled successfully", order);
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    next(err);
  }
}

// PUT /api/farmer/orders/:id/accept
async function acceptOrder(req, res, next) {
  await transitionOrderStatus(req, res, next, "pending", "accepted");
}

// PUT /api/farmer/orders/:id/reject
async function rejectOrder(req, res, next) {
  // Rejecting returns stock to inventory, same as cancellation.
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction });
    if (!order) {
      await transaction.rollback();
      return error(res, 404, "Order not found");
    }
    if (order.farmer_id !== req.user.id) {
      await transaction.rollback();
      return error(res, 403, "You do not have access to this order");
    }
    if (order.status !== "pending") {
      await transaction.rollback();
      return error(res, 400, `Order cannot be rejected once it is '${order.status}'`);
    }

    const items = await OrderItem.findAll({ where: { order_id: order.id }, transaction });
    for (const item of items) {
      const riceProduct = await RiceProduct.findByPk(item.rice_product_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (riceProduct) {
        riceProduct.quantity_available += item.quantity;
        await riceProduct.save({ transaction });
      }
    }

    order.status = "rejected";
    await order.save({ transaction });

    await transaction.commit();
    return success(res, 200, "Order rejected", order);
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    next(err);
  }
}

// PUT /api/farmer/orders/:id/status  body: { status: "processing" | "out_for_delivery" | "delivered" }
const ALLOWED_TRANSITIONS = {
  accepted: ["processing"],
  processing: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
};

async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return error(res, 404, "Order not found");
    if (order.farmer_id !== req.user.id) return error(res, 403, "You do not have access to this order");

    const allowedNext = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowedNext.includes(status)) {
      return error(res, 400, `Cannot move order from '${order.status}' to '${status}'`);
    }

    order.status = status;
    await order.save();

    return success(res, 200, "Order status updated", order);
  } catch (err) {
    next(err);
  }
}

async function transitionOrderStatus(req, res, next, fromStatus, toStatus) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return error(res, 404, "Order not found");
    if (order.farmer_id !== req.user.id) return error(res, 403, "You do not have access to this order");
    if (order.status !== fromStatus) {
      return error(res, 400, `Order must be '${fromStatus}' to perform this action`);
    }

    order.status = toStatus;
    await order.save();

    return success(res, 200, `Order ${toStatus}`, order);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  getCustomerOrders,
  getFarmerOrders,
  getOrderById,
  cancelOrder,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
};
