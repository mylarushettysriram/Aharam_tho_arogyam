require("dotenv").config();

// All WhatsApp Business Cloud API config lives here and ONLY here.
// These values must never be sent to the frontend.
module.exports = {
  token: process.env.WHATSAPP_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  apiVersion: process.env.WHATSAPP_API_VERSION || "v20.0",
  templateName: process.env.WHATSAPP_ORDER_TEMPLATE_NAME || "new_order",
  templateLanguage: process.env.WHATSAPP_ORDER_TEMPLATE_LANGUAGE || "en_US",
  defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91",
  get baseUrl() {
    return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
  },
};
