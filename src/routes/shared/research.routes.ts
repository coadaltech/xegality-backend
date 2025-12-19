import Elysia, { t } from "elysia";
import { app_middleware } from "../../middlewares";
import { ResearchService } from "../../services/research.service";
import { pool } from "../../config/ms-sql.db";

const research_routes = new Elysia({ prefix: "/shared" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers });

      set.status = state_result.code;
      if (!state_result.data) return state_result

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    }
  })

  .get("/case-search",
    async ({ set, store, query }) => {
      try {
        const { query: searchQuery, searchType, court, year, limit, offset } = query;

        const result = await ResearchService.searchCases({
          query: searchQuery,
          searchType: searchType || "judgement",
          court: court || undefined,
          year: year ? parseInt(year) : undefined,
          limit: limit ? parseInt(limit) : 20,
          offset: offset ? parseInt(offset) : 0,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: "Failed to search cases",
        };
      }
    },
    {
      query: t.Object({
        query: t.String({ description: "Search String" }),
        searchType: t.Optional(t.String({ description: "Search type (judgement, court, judges, etc.)" })),
        court: t.Optional(t.String({ description: "Court filter" })),
        year: t.Optional(t.String({ description: "Year filter" })),
        limit: t.Optional(t.String({ description: "Limit results" })),
        offset: t.Optional(t.String({ description: "Offset for pagination" })),
      })
    }
  )

  .get("/case/:keycode",
    async ({ set, store, params }) => {
      try {
        const { keycode } = params;
        const caseData = await ResearchService.getCaseById(parseInt(keycode));

        if (!caseData) {
          set.status = 404;
          return {
            success: false,
            error: "Case not found",
          };
        }

        return {
          success: true,
          data: caseData,
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: "Failed to get case details",
        };
      }
    },
    {
      params: t.Object({
        keycode: t.String({ description: "Case keycode" })
      })
    }
  )

  .get("/courts",
    async ({ set, store }) => {
      try {
        const courts = await ResearchService.getCourts();
        return {
          success: true,
          data: courts,
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: "Failed to get courts list",
        };
      }
    }
  )

  .get("/test-sql",
    async ({ set, store }) => {
      try {
        const courts = await pool.request().query("SELECT Judges, Advocates FROM citation WHERE Judges like '%fazal%'");
        set.status = 200;
        return {
          success: true,
          data: courts,
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: "Failed to get courts list",
        };
      }
    }
  )

  .get("/years",
    async ({ set, store }) => {
      try {
        const years = await ResearchService.getYears();
        return {
          success: true,
          data: years,
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: "Failed to get years list",
        };
      }
    }
  )

export default research_routes;
