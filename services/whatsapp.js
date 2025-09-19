const axios = require("axios");
require("dotenv").config();

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  async sendMessage(to, message) {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error sending WhatsApp message:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async sendInteractiveMenu(to, headerText, bodyText, footerText, options) {
    try {
      const interactiveMessage = {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "list",
          header: {
            type: "text",
            text: headerText,
          },
          body: {
            text: bodyText,
          },
          footer: {
            text: footerText,
          },
          action: {
            button: "Select Option",
            sections: [
              {
                title: "Options",
                rows: options.map((option, index) => ({
                  id: option.id || `option_${index}`,
                  title: option.title,
                  description: option.description || "",
                })),
              },
            ],
          },
        },
      };

      const response = await axios.post(this.baseUrl, interactiveMessage, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error sending interactive menu:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async sendButtons(to, bodyText, buttons) {
    try {
      const buttonMessage = {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: bodyText,
          },
          action: {
            buttons: buttons.map((button, index) => ({
              type: "reply",
              reply: {
                id: button.id || `btn_${index}`,
                title: button.title,
              },
            })),
          },
        },
      };

      const response = await axios.post(this.baseUrl, buttonMessage, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error sending buttons:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async sendDocument(to, documentUrl, filename, caption) {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "document",
          document: {
            link: documentUrl,
            filename: filename,
            caption: caption,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error sending document:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

module.exports = WhatsAppService;
