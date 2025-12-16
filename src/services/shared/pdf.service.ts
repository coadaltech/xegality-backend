import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import db from "../../config/db";
import { lawyer_invoice_model } from "../../models/lawyer/payments.model";
import { user_model } from "../../models/shared/user.model";
import { eq } from "drizzle-orm";

interface InvoiceItem {
  title: string;
  quantity: number;
  price: number;
}

const generateInvoicePDF = async (invoiceId: string) => {
  try {
    // Fetch invoice
    const invoice = await db
      .select({
        invoice_number: lawyer_invoice_model.invoice_number,
        client_name: lawyer_invoice_model.client_name,
        client_email: lawyer_invoice_model.client_email,
        client_phone: lawyer_invoice_model.client_phone,
        description: lawyer_invoice_model.description,
        date_issued: lawyer_invoice_model.date_issued,
        items: lawyer_invoice_model.items,
        total_amount: lawyer_invoice_model.total_amount,
        note: lawyer_invoice_model.note,
        lawyer_name: user_model.name,
        lawyer_email: user_model.email,
        lawyer_phone: user_model.phone,
      })
      .from(lawyer_invoice_model)
      .leftJoin(user_model, eq(lawyer_invoice_model.issuer_id, user_model.id))
      .where(eq(lawyer_invoice_model.invoice_number, invoiceId))
      .limit(1);

    if (!invoice.length) {
      return { success: false, code: 404, message: "Invoice not found" };
    }

    const data = invoice[0];

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    // -----------------------------------
    // HEADER (professional left/right)
    // -----------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("INVOICE", margin, 25);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    const headerRightX = pageWidth - margin;

    doc.text(`Invoice #: ${data.invoice_number}`, headerRightX, 20, {
      align: "right",
    });
    doc.text(
      `Date: ${new Date(data.date_issued).toLocaleDateString()}`,
      headerRightX,
      28,
      { align: "right" }
    );

    // -----------------------------------
    // FROM + BILL TO SECTION (grey box)
    // -----------------------------------
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, 40, pageWidth - margin * 2, 40, "F");

    // Lawyer (From)
    doc.setFont("helvetica", "bold");
    doc.text("From:", margin + 5, 50);
    doc.setFont("helvetica", "normal");
    doc.text(data.lawyer_name || "N/A", margin + 5, 58);
    if (data.lawyer_email) doc.text(data.lawyer_email, margin + 5, 66);
    if (data.lawyer_phone) doc.text(String(data.lawyer_phone), margin + 5, 74);

    // Client (Bill To)
    const billX = pageWidth / 2 + 10;
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", billX, 50);

    doc.setFont("helvetica", "normal");
    doc.text(data.client_name, billX, 58);
    if (data.client_email) doc.text(data.client_email, billX, 66);
    if (data.client_phone) doc.text(String(data.client_phone), billX, 74);

    // -----------------------------------
    // DESCRIPTION SECTION
    // -----------------------------------
    let cursorY = 95;

    doc.setFont("helvetica", "bold");
    doc.text("Service Description", margin, cursorY);

    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(
      data.description,
      pageWidth - margin * 2
    );
    doc.text(descLines, margin, cursorY + 8);

    cursorY += descLines.length * 6 + 15;

    // -----------------------------------
    // ITEMS TABLE
    // -----------------------------------
    const items: InvoiceItem[] =
      typeof data.items === "string"
        ? JSON.parse(data.items)
        : data.items || [];

    const tableRows = items.map((item) => [
      item.title,
      item.quantity,
      `INR ${item.price.toFixed(2)}`,
      `INR ${(item.quantity * item.price).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [["Description", "Qty", "Price", "Amount"]],
      body: tableRows,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 20,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 30, halign: "right" },
      },
    });

    const afterTableY = doc.lastAutoTable.finalY + 20;

    // -----------------------------------
    // TOTAL SECTION (clean & right aligned)
    // -----------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);

    doc.text("Total Amount:", pageWidth - margin - 50, afterTableY, {
      align: "right",
    });

    doc.text(
      `INR ${data.total_amount.toFixed(2)}`,
      pageWidth - margin,
      afterTableY,
      { align: "right" }
    );

    // -----------------------------------
    // NOTES SECTION
    // -----------------------------------
    if (data.note) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Notes", margin, afterTableY + 20);

      doc.setDrawColor(180);
      doc.line(margin, afterTableY + 25, pageWidth - margin, afterTableY + 25);

      doc.setFont("helvetica", "normal");
      const notesText = doc.splitTextToSize(data.note, pageWidth - margin * 2);
      doc.text(notesText, margin, afterTableY + 35);
    }

    // OUTPUT BUFFER
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return {
      success: true,
      code: 200,
      message: "PDF generated successfully",
      data: pdfBuffer,
      filename: `invoice-${data.invoice_number}.pdf`,
    };
  } catch (error: any) {
    console.error("PDF Error:", error);
    return {
      success: false,
      code: 500,
      message: "Internal server error while generating PDF",
      error: error?.message || String(error),
    };
  }
};

export { generateInvoicePDF };
