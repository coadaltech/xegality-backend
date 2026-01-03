import { pool, ensureConnected, executeQuery } from "../config/ms-sql.db";

export interface CaseSearchResult {
  keycode: number;
  court: string;
  judges: string;
  bench: string;
  courtBench: string;
  caseNo: string;
  appellant: string;
  respondent: string;
  date: string;
  advocates: string;
  headnote: string;
  hNote: string;
  casesReferred: string;
  judgement: string;
  previousCourt: string;
  year: number;
  result: string;
  fullequivicit: string;
  actreferred: string;
  htmlFormat: string;
  mainkey: string;
}

export interface CaseSearchParams {
  query: string;
  searchType?: string;
  court?: string;
  year?: number;
  limit?: number;
  offset?: number;
}

export class ResearchService {
  /**
   * Search for cases based on query string in specific column
   */
  static async searchCases(params: CaseSearchParams): Promise<{
    cases: CaseSearchResult[];
    total: number;
  }> {
    try {
      await ensureConnected();
      const { query, searchType = "judgement", court, year, limit = 20, offset = 0 } = params;

      // Map search types to database columns
      const columnMap: { [key: string]: string } = {
        "judgement": "Judgement",
        "court": "COURT",
        "judges": "Judges",
        "caseNo": "CaseNo",
        "advocates": "Advocates",
        "casesReferred": "CasesReferred",
        "actreferred": "Actreferred"
      };

      const searchColumn = columnMap[searchType] || "Judgement";

      // Build the WHERE clause for search in specific column
      let whereClause = `${searchColumn} LIKE '%${query}%'`;

      // Add court filter if provided
      if (court) {
        whereClause += ` AND COURT LIKE '%${court}%'`;
      }

      // Add year filter if provided
      if (year) {
        whereClause += ` AND year = ${year}`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM citation WHERE ${whereClause}`;
      const countResult = await executeQuery<{ total: number }>(countQuery);
      const total = countResult.recordset[0].total;

      // Get paginated results
      const searchQuery = `
        SELECT
          Keycode, COURT, Judges, Bench, CourtBench, CaseNo, Appellant, Respondent,
          Date, Advocates, Headnote, HNote, CasesReferred, Judgement, PreviousCourt,
          year, Result, Fullequivicit, Actreferred, HTMLFormat, mainkey
        FROM dbo.citation
        WHERE ${whereClause}
        ORDER BY Date DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY;
      `;

      const result = await executeQuery(searchQuery);

      const cases: CaseSearchResult[] = result.recordset.map((row: any) => ({
        keycode: row.Keycode,
        court: row.COURT,
        judges: row.Judges,
        bench: row.Bench,
        courtBench: row.CourtBench,
        caseNo: row.CaseNo,
        appellant: row.Appellant,
        respondent: row.Respondent,
        date: row.Date,
        advocates: row.Advocates,
        headnote: row.Headnote,
        hNote: row.HNote,
        casesReferred: row.CasesReferred,
        judgement: row.Judgement,
        previousCourt: row.PreviousCourt,
        year: row.year,
        result: row.Result,
        fullequivicit: row.Fullequivicit,
        actreferred: row.Actreferred,
        htmlFormat: row.HTMLFormat,
        mainkey: row.mainkey,
      }));

      return { cases, total };
    } catch (error) {
      console.error("Error searching cases:", error);
      throw new Error("Failed to search cases");
    }
  }

  /**
   * Get case details by keycode
   */
  static async getCaseById(keycode: number): Promise<CaseSearchResult | null> {
    try {
      await ensureConnected();
      const query = `
        SELECT 
          Keycode, COURT, Judges, Bench, CourtBench, CaseNo, Appellant, Respondent, 
          Date, Advocates, Headnote, HNote, CasesReferred, Judgement, PreviousCourt, 
          year, Result, Fullequivicit, Actreferred, HTMLFormat, mainkey
        FROM citation 
        WHERE Keycode = ${keycode}
      `;

      const result = await executeQuery(query);

      if (result.recordset.length === 0) {
        return null;
      }

      const row = result.recordset[0];
      return {
        keycode: row.Keycode,
        court: row.COURT,
        judges: row.Judges,
        bench: row.Bench,
        courtBench: row.CourtBench,
        caseNo: row.CaseNo,
        appellant: row.Appellant,
        respondent: row.Respondent,
        date: row.Date,
        advocates: row.Advocates,
        headnote: row.Headnote,
        hNote: row.HNote,
        casesReferred: row.CasesReferred,
        judgement: row.Judgement,
        previousCourt: row.PreviousCourt,
        year: row.year,
        result: row.Result,
        fullequivicit: row.Fullequivicit,
        actreferred: row.Actreferred,
        htmlFormat: row.HTMLFormat,
        mainkey: row.mainkey,
      };
    } catch (error) {
      console.error("Error getting case by ID:", error);
      throw new Error("Failed to get case details");
    }
  }

  /**
   * Get distinct courts for filter dropdown
   */
  static async getCourts(): Promise<string[]> {
    try {
      await ensureConnected();
      const query = `
        SELECT DISTINCT COURT 
        FROM citation 
        WHERE COURT IS NOT NULL AND COURT != ''
        ORDER BY COURT
      `;

      const result = await executeQuery(query);
      return result.recordset.map((row: any) => row.COURT);
    } catch (error) {
      console.error("Error getting courts:", error);
      throw new Error("Failed to get courts list");
    }
  }

  /**
   * Get distinct years for filter dropdown
   */
  static async getYears(): Promise<number[]> {
    try {
      await ensureConnected();
      const query = `
        SELECT DISTINCT year 
        FROM citation 
        WHERE year IS NOT NULL
        ORDER BY year DESC
      `;

      const result = await executeQuery(query);
      return result.recordset.map((row: any) => row.year);
    } catch (error) {
      console.error("Error getting years:", error);
      throw new Error("Failed to get years list");
    }
  }
}


