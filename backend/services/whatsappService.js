const https = require("https");
const whatsappConfig = require("../config/whatsapp");
const { normalizePhoneNumber } = require("../utils/phone");

function sendWhatsAppMessage(toPhoneNumber, message) {
  return new Promise((resolve) => {
    if (!whatsappConfig.token || !whatsappConfig.phoneNumberId) {
      console.warn("[WhatsApp] Credentials not configured - skipping notification.");
      return resolve({ ok: false, reason: "not_configured" });
    }

    const normalizedNumber = normalizePhoneNumber(toPhoneNumber);
    if (!normalizedNumber) {
      console.warn("[WhatsApp] Farmer has no valid phone number - skipping notification.");
      return resolve({ ok: false, reason: "farmer_phone_missing" });
    }

    const payload = JSON.stringify({
      messaging_product: "whatsapp",
      to: normalizedNumber,
      type: "template",
      template: {
        name: whatsappConfig.templateName,
        language: { code: whatsappConfig.templateLanguage },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: message }],
          },
        ],
      },
    });

    const url = new URL(whatsappConfig.baseUrl);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${whatsappConfig.token}`,
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, response: body });
        } else {
          console.error("[WhatsApp] API error:", res.statusCode, body);
          resolve({ ok: false, reason: "api_error", status: res.statusCode, body });
        }
      });
    });

    req.on("error", (err) => {
      // Network failure etc. Log it but never throw - order must still succeed.
      console.error("[WhatsApp] Request failed:", err.message);
      resolve({ ok: false, reason: "network_error", error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

function buildOrderNotificationMessage({ order, farmer, customer, items }) {
  const itemLines = items
    .map(
      (i) =>
        `Rice: ${i.riceName}\nQuantity: ${i.quantity} bags\nPrice: ₹${i.pricePerBag} / bag`
    )
    .join("\n\n");
  const location = [
    order.delivery_address,
    order.delivery_city,
    order.delivery_state,
    order.delivery_pincode,
  ]
    .filter(Boolean)
    .join(", ");
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  const paymentMethod = order.payment_method === "upi" ? "UPI (paid online)" : "Cash on Delivery";

  return (
    `New Rice Booking\n` +
    `Order ID: #ORD${order.id}\n` +
    `Customer name: ${order.delivery_name || customer.name}\n` +
    `Customer mobile: ${order.delivery_phone}\n` +
    `${order.alternate_phone ? `Alternate mobile: ${order.alternate_phone}\n` : ""}` +
    `${itemLines}\n` +
    `Total price: ₹${order.total_amount}\n` +
    `Payment: ${paymentMethod}\n\n` +
    `Delivery address:\n${location}\n` +
    `Maps: ${mapLink}\n\n` +
    `Please contact the customer to arrange delivery.`
  );
}

async function notifyFarmerNewOrder({ order, farmer, customer, items }) {
  try {
    if (!farmer?.phone) {
      console.warn(`[WhatsApp] No phone number saved for farmer of order #${order.id}`);
      return { ok: false, reason: "farmer_phone_missing" };
    }

    const message = buildOrderNotificationMessage({ order, farmer, customer, items });
    const result = await sendWhatsAppMessage(farmer.phone, message);
    if (!result.ok) {
      console.warn(`[WhatsApp] Notification not sent for order #${order.id}: ${result.reason}`);
    }
    return result;
  } catch (err) {
    // Defensive catch-all: WhatsApp must never break order creation.
    console.error("[WhatsApp] Unexpected error while notifying farmer:", err.message);
    return { ok: false, reason: "unexpected_error" };
  }
}

module.exports = { sendWhatsAppMessage, notifyFarmerNewOrder };
