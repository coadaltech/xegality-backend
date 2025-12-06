import Elysia, { t } from "elysia";
import { sendContactEmail } from "../../services/shared/contact.service";

const contact_routes = new Elysia().post(
  "/contact",
  async ({ body }) => {
    try {
      await sendContactEmail(body);
      return { success: true, message: "Message sent successfully" };
    } catch (error) {
      console.error("Contact form error:", error);
      return { success: false, message: "Failed to send message" };
    }
  },
  {
    body: t.Object({
      name: t.String(),
      email: t.String(),
      subject: t.String(),
      message: t.String(),
    }),
  }
);

export default contact_routes;
