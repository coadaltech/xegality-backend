import { eq, desc } from "drizzle-orm";
import db from "../../config/db";
import { lawyer_invoice_model, LawyerInvoiceType, InsertLawyerInvoiceType, UpdateLawyerInvoiceType } from "../../models/lawyer/payments.model";
import { user_model } from "../../models/shared/user.model";
import { PAYMENT_STATUS_CONST, RoleType } from "../../types/user.types";


type clientDetailsType = {
  client_id: number | null,
  client_name: string,
  client_phone: string | null,
  client_email: string | null,
};

const create_invoice = async (invoiceData: any, lawyerId: number) => {
  try {
    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    let clientDetails: clientDetailsType = {
      client_id: null,
      client_name: "",
      client_phone: null,
      client_email: null,
    };

    // If client_id is provided, fetch client details from user_model
    if (invoiceData.client_id) {
      const clientResult = await db
        .select({
          id: user_model.id,
          name: user_model.name,
          phone: user_model.phone,
          email: user_model.email,
        })
        .from(user_model)
        .where(eq(user_model.id, invoiceData.client_id));

      if (clientResult.length > 0) {
        const client = clientResult[0];
        clientDetails = {
          client_id: client.id,
          client_name: client.name || "",
          client_phone: client.phone?.toString() || null,
          client_email: client.email || null,
        };
      } else {
        return {
          success: false,
          code: 404,
          message: "Client not found with the provided ID",
        };
      }
    } else {
      // Use manually provided client details
      clientDetails = {
        client_id: null,
        client_name: invoiceData.client_name || "",
        client_phone: invoiceData.client_phone || null,
        client_email: invoiceData.client_email || null,
      };
    }

    const invoicePayload: InsertLawyerInvoiceType = {
      issuer_id: lawyerId,
      invoice_number: invoiceNumber,
      client_id: clientDetails.client_id,
      client_name: clientDetails.client_name,
      client_phone: clientDetails.client_phone,
      client_email: clientDetails.client_email,
      case_reference: invoiceData.case_reference,
      description: invoiceData.description || "",
      date_issued: invoiceData.date_issued ? new Date(invoiceData.date_issued) : new Date(),
      items: invoiceData.items || [],
      total_amount: invoiceData.total_amount || 0,
      status: invoiceData.status || "pending",
      note: invoiceData.note,
    };

    const db_result = await db.insert(lawyer_invoice_model).values(invoicePayload).returning();

    if (db_result.length === 0) {
      return {
        success: false,
        code: 400,
        message: "Failed to create invoice",
      };
    }

    return {
      success: true,
      code: 201,
      message: "Invoice created successfully",
      data: db_result[0],
    };
  } catch (error) {
    console.log("error ->", error)
    return {
      success: false,
      code: 500,
      message: "ERROR create_invoice",
      error: String(error),
    };
  }
};

const get_invoices_list = async (id: number, role: RoleType) => {
  try {
    const db_result = await db
      .select()
      .from(lawyer_invoice_model)
      .where(
        eq(role === "consumer"
          ? lawyer_invoice_model.client_id
          : lawyer_invoice_model.issuer_id,
          id
        ))
      .orderBy(desc(lawyer_invoice_model.date_issued));

    return {
      success: true,
      code: 200,
      message: db_result.length === 0 ? "No invoices found" : `Total ${db_result.length} invoices found`,
      data: db_result,
    };
  } catch (error) {
    console.log("error ->", error)
    return {
      success: false,
      code: 500,
      message: "ERROR get_invoices_list",
      error: String(error),
    };
  }
};

const get_invoice_details = async (invoiceId: string, lawyerId: number) => {
  try {
    const db_results = await db
      .select()
      .from(lawyer_invoice_model)
      .where(
        eq(lawyer_invoice_model.invoice_number, invoiceId)
      );

    if (db_results.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Invoice not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Invoice details retrieved successfully",
      data: db_results[0],
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_invoice_details",
      error: String(error),
    };
  }
};

const update_invoice = async (invoiceData: any, lawyerId: number) => {
  try {
    const { invoice_number, ...updateData } = invoiceData;

    // Convert date_issued to Date if it's a string
    if (updateData.date_issued && typeof updateData.date_issued === 'string') {
      updateData.date_issued = new Date(updateData.date_issued);
    }

    const db_result = await db
      .update(lawyer_invoice_model)
      .set(updateData)
      .where(
        eq(lawyer_invoice_model.invoice_number, invoice_number)
      )
      .returning();

    if (db_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Invoice not found or you don't have permission to update it",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Invoice updated successfully",
      data: db_result[0],
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR update_invoice",
      error: String(error),
    };
  }
};

const delete_invoice = async (invoiceNumber: string, lawyerId: number) => {
  try {
    const db_result = await db
      .delete(lawyer_invoice_model)
      .where(
        eq(lawyer_invoice_model.invoice_number, invoiceNumber)
      )
      .returning();

    if (db_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Invoice not found or you don't have permission to delete it",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Invoice deleted successfully",
      data: db_result[0],
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR delete_invoice",
      error: String(error),
    };
  }
};

const update_invoice_status = async (invoiceNumber: string, status: string, lawyerId: number) => {
  try {
    if (!PAYMENT_STATUS_CONST.includes(status as any)) {
      return {
        success: false,
        code: 400,
        message: "Invalid status. Must be one of: " + PAYMENT_STATUS_CONST.join(", "),
      };
    }

    const db_result = await db
      .update(lawyer_invoice_model)
      .set({ status: status as any })
      .where(
        eq(lawyer_invoice_model.invoice_number, invoiceNumber)
      )
      .returning();

    if (db_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Invoice not found or you don't have permission to update it",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Invoice status updated successfully",
      data: db_result[0],
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR update_invoice_status",
      error: String(error),
    };
  }
};

export {
  create_invoice,
  get_invoices_list,
  get_invoice_details,
  update_invoice,
  delete_invoice,
  update_invoice_status
};
