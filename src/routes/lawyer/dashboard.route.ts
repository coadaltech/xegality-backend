import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import { CaseSchema } from "../../types/case.types";
import {
  get_case_details,
  get_cases_list,
} from "../../services/shared/case.service";
import {
  create_new_case,
  get_cases_history,
  get_connected_consumers,
  update_case,
} from "../../services/lawyer/dashboard.service";
import {
  create_invoice,
  get_invoices_list,
  get_invoice_details,
  update_invoice,
  delete_invoice,
  update_invoice_status,
} from "../../services/lawyer/payment.service";
import {
  upload_case_document,
  get_case_documents,
} from "../../services/shared/media.service";
import { RoleType } from "../../types/user.types";
import { LawyerInvoiceSchema } from "@/types/invoice.type";

const lawyer_dashboard_routes = new Elysia({ prefix: "/lawyer/dashboard" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({
        cookie,
        headers,
        allowed: ["lawyer"],
      });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    },
  })

  .post(
    "/create-case",
    async ({ set, store, body }) => {
      const create_case_response = await create_new_case(body, store.id);

      set.status = create_case_response.code;
      return create_case_response;
    },
    {
      body: CaseSchema,
    }
  )

  .post(
    "/update-case",
    async ({ set, store, body }) => {
      const create_case_response = await update_case(body);

      set.status = create_case_response.code;
      return create_case_response;
    },
    {
      body: CaseSchema,
    }
  )

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

  .get("/fetch-connected-consumers", async ({ set, store }) => {
    const results = await get_connected_consumers(store.id);

    set.status = results.code;
    return results;
  })

  .post(
    "/create-invoice",
    async ({ set, store, body }) => {
      const create_invoice_response = await create_invoice(body, store.id);

      set.status = create_invoice_response.code;
      return create_invoice_response;
    },
    {
      body: LawyerInvoiceSchema,
    }
  )

  .post(
    "/update-invoice",
    async ({ set, store, body }) => {
      const update_invoice_response = await update_invoice(body, store.id);

      set.status = update_invoice_response.code;
      return update_invoice_response;
    },
    {
      body: LawyerInvoiceSchema,
    }
  )

  .get("/fetch-all-invoices", async ({ set, store }) => {
    const invoices_response = await get_invoices_list(
      store.id,
      store.role as RoleType
    );

    set.status = invoices_response.code;
    return invoices_response;
  })

  .get(
    "/fetch-invoice-details/:invoiceNumber",
    async ({ set, store, params }) => {
      const invoice_response = await get_invoice_details(
        params.invoiceNumber,
        store.id
      );

      set.status = invoice_response.code;
      return invoice_response;
    },
    {
      params: t.Object({
        invoiceNumber: t.String({
          description: "Invoice number to fetch details for",
        }),
      }),
    }
  )

  .delete(
    "/delete-invoice/:invoiceNumber",
    async ({ set, store, params }) => {
      const delete_response = await delete_invoice(
        params.invoiceNumber,
        store.id
      );

      set.status = delete_response.code;
      return delete_response;
    },
    {
      params: t.Object({
        invoiceNumber: t.String({ description: "Invoice number to delete" }),
      }),
    }
  )

  .put(
    "/update-invoice-status/:invoiceNumber",
    async ({ set, store, params, body }) => {
      const update_status_response = await update_invoice_status(
        params.invoiceNumber,
        body.status,
        store.id
      );

      set.status = update_status_response.code;
      return update_status_response;
    },
    {
      params: t.Object({
        invoiceNumber: t.String({
          description: "Invoice number to update status for",
        }),
      }),
      body: t.Object({
        status: t.String({ description: "New status for the invoice" }),
      }),
    }
  )

  .get("/fetch-closed-cases", async ({ set, store }) => {
    const history_res = await get_cases_history(store.id);

    set.status = history_res.code;
    return history_res;
  })

  .post(
    "/upload-document/:caseId",
    async ({ set, store, params, body }) => {
      const upload_res = await upload_case_document(
        body.file,
        params.caseId,
        store.id
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
  );

export default lawyer_dashboard_routes;
