import { Elysia, t } from "elysia";
import { app_middleware, authenticate_jwt } from "../../middlewares";
import {
  get_connected_lawyers,
  delete_case,
} from "../../services/consumer/dashboard.service";
import {
  get_case_details,
  get_cases_list,
} from "../../services/shared/case.service";
import {
  get_applications_list,
  get_application_details,
  update_application,
} from "../../services/shared/application.service";
import { RoleType } from "@/types/user.types";
import { UpdateApplicationSchema } from "@/types/ca.types";
import { get_invoices_list } from "@/services/lawyer/payment.service";
import { generateInvoicePDF } from "@/services/shared/pdf.service";
import {
  upload_case_document,
  get_case_documents,
  update_document_title,
} from "@/services/shared/media.service";

const consumer_dashboard_routes = new Elysia({ prefix: "/consumer/dashboard" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({
        cookie,
        headers,
        allowed: ["consumer"],
      });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    },
  })

  .delete(
    "/delete-case/:id",
    async ({ set, store, params }) => {
      const delete_response = await delete_case(params.id, store.id);

      set.status = delete_response.code;
      return delete_response;
    },
    {
      params: t.Object({
        id: t.String({ description: "Case ID to delete" }),
      }),
    }
  )

  .get("/fetch-connected-lawyers", async ({ set, store }) => {
    const results = await get_connected_lawyers(store.id);

    set.status = results.code;
    return results;
  })

  .get("/fetch-all-cases", async ({ set, store }) => {
    const cases_response = await get_cases_list(
      store.id,
      store.role as RoleType
    );

    set.status = cases_response.code;
    return cases_response;
  })

  .get(
    "/fetch-case-details/:id",
    async ({ set, params }) => {
      const cases_response = await get_case_details(params.id);

      set.status = cases_response.code;
      return cases_response;
    },
    {
      params: t.Object({
        id: t.String({ description: "ID of the case to fetch details for" }),
      }),
    }
  )

  .get(
    "/fetch-all-applications",
    async ({ set, params }) => {
      const results = await get_applications_list(
        params.consumer_id,
        "consumer"
      );

      set.status = results.code;
      return results;
    },
    {
      params: t.Object({
        consumer_id: t.Number({
          description: "ID of the consumer to fetch applications for",
        }),
      }),
    }
  )

  .get(
    "/fetch-application-details/:id",
    async ({ set, params }) => {
      const application_response = await get_application_details(params.id);

      set.status = application_response.code;
      return application_response;
    },
    {
      params: t.Object({
        id: t.String({
          description: "ID of the application to fetch details for",
        }),
      }),
    }
  )

  .post(
    "/update-application",
    async ({ set, store, body }) => {
      const result = await update_application(body as any);

      set.status = result.code;
      return result;
    },
    { body: UpdateApplicationSchema }
  )

  .get("/fetch-all-invoices", async ({ set, store }) => {
    const invoices_response = await get_invoices_list(
      store.id,
      store.role as RoleType
    );

    set.status = invoices_response.code;
    return invoices_response;
  })

  .post(
    "/upload-document/:caseId",
    async ({ set, store, params, body }) => {
      const upload_res = await upload_case_document(
        body.file,
        params.caseId,
        store.id,
        body.title
      );

      set.status = upload_res.code;
      return upload_res;
    },
    {
      params: t.Object({
        caseId: t.String({ description: "Case ID to upload document for" }),
      }),
      body: t.Object({
        file: t.File(),
        title: t.Optional(t.String()),
      }),
    }
  )

  .get(
    "/documents/:caseId",
    async ({ set, params }) => {
      const docs_res = await get_case_documents(params.caseId);

      set.status = docs_res.code;
      return docs_res;
    },
    {
      params: t.Object({
        caseId: t.String({ description: "Case ID to fetch documents for" }),
      }),
    }
  )

  .put(
    "/documents/:documentId/title",
    async ({ set, params, body }) => {
      const update_res = await update_document_title(
        parseInt(params.documentId),
        body.title
      );

      set.status = update_res.code;
      return update_res;
    },
    {
      params: t.Object({
        documentId: t.String({
          description: "Document ID to update title for",
        }),
      }),
      body: t.Object({
        title: t.String({ description: "New document title" }),
      }),
    }
  )

  .get(
    "/download-invoice/:invoiceId",
    async ({ set, params }) => {
      const pdf_response = await generateInvoicePDF(params.invoiceId);

      set.status = pdf_response.code;
      if (pdf_response.success) {
        return new Response(pdf_response.data, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${pdf_response.filename}"`,
          },
        });
      }
      return pdf_response;
    },
    {
      params: t.Object({
        invoiceId: t.String({
          description: "Invoice ID to generate PDF for",
        }),
      }),
    }
  );

export default consumer_dashboard_routes;
