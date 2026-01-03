import db from "@/config/db";
import { firm_model, UpdateFirmType, InsertFirmType } from "../../models/lawyer/firm.model";
import { lawyer_profile_model } from "../../models/lawyer/lawyer.model";
import { eq, ilike, or, and } from "drizzle-orm";
import { undefinedToNull } from "@/utils/ts.utils";

const search_firms = async (query: string) => {
  try {
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        code: 400,
        message: "Search query is required",
      };
    }

    const searchTerm = `%${query.trim()}%`;
    const results = await db
      .select()
      .from(firm_model)
      .where(ilike(firm_model.name, searchTerm))
      .limit(20);

    return {
      success: true,
      code: 200,
      message: "Firms fetched successfully",
      data: results,
    };
  } catch (error: any) {
    return {
      success: false,
      code: 500,
      message: "ERROR search_firms",
      error: error.message,
    };
  }
};

const get_my_firm = async (lawyer_id: number) => {
  try {
    const lawyer = await db
      .select({ law_firm_id: lawyer_profile_model.law_firm_id })
      .from(lawyer_profile_model)
      .where(eq(lawyer_profile_model.id, lawyer_id))
      .limit(1);

    if (lawyer.length === 0 || !lawyer[0].law_firm_id) {
      return {
        success: false,
        code: 404,
        message: "No firm associated with this lawyer",
      };
    }

    const firm = await db
      .select()
      .from(firm_model)
      .where(eq(firm_model.id, lawyer[0].law_firm_id))
      .limit(1);

    if (firm.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Firm not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Firm fetched successfully",
      data: firm[0],
    };
  } catch (error: any) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_my_firm",
      error: error.message,
    };
  }
};

const create_firm = async (lawyer_id: number, firm_data: InsertFirmType) => {
  try {
    const refined_data = undefinedToNull({
      ...firm_data,
      created_by: lawyer_id,
    });

    const result = await db
      .insert(firm_model)
      .values(refined_data as InsertFirmType)
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        code: 500,
        message: "Failed to create firm",
      };
    }

    const created_firm = result[0];

    // Update lawyer's law_firm_id
    await db
      .update(lawyer_profile_model)
      .set({ law_firm_id: created_firm.id })
      .where(eq(lawyer_profile_model.id, lawyer_id));

    return {
      success: true,
      code: 201,
      message: "Firm created successfully",
      data: created_firm,
    };
  } catch (error: any) {
    return {
      success: false,
      code: 500,
      message: "ERROR create_firm",
      error: error.message,
    };
  }
};

const update_firm = async (lawyer_id: number, firm_id: number, firm_data: UpdateFirmType) => {
  try {
    // Verify that the firm belongs to this lawyer
    const lawyer = await db
      .select({ law_firm_id: lawyer_profile_model.law_firm_id })
      .from(lawyer_profile_model)
      .where(eq(lawyer_profile_model.id, lawyer_id))
      .limit(1);

    if (lawyer.length === 0 || lawyer[0].law_firm_id !== firm_id) {
      // Also check if the lawyer created the firm
      const firm = await db
        .select({ created_by: firm_model.created_by })
        .from(firm_model)
        .where(eq(firm_model.id, firm_id))
        .limit(1);

      if (firm.length === 0 || firm[0].created_by !== lawyer_id) {
        return {
          success: false,
          code: 403,
          message: "You don't have permission to update this firm",
        };
      }
    }

    const refined_data = undefinedToNull(firm_data);

    const result = await db
      .update(firm_model)
      .set(refined_data)
      .where(eq(firm_model.id, firm_id))
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Firm not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Firm updated successfully",
      data: result[0],
    };
  } catch (error: any) {
    return {
      success: false,
      code: 500,
      message: "ERROR update_firm",
      error: error.message,
    };
  }
};

const associate_firm = async (lawyer_id: number, firm_id: number) => {
  try {
    // Verify firm exists
    const firm = await db
      .select()
      .from(firm_model)
      .where(eq(firm_model.id, firm_id))
      .limit(1);

    if (firm.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Firm not found",
      };
    }

    // Update lawyer's law_firm_id
    await db
      .update(lawyer_profile_model)
      .set({ law_firm_id: firm_id })
      .where(eq(lawyer_profile_model.id, lawyer_id));

    return {
      success: true,
      code: 200,
      message: "Firm associated successfully",
      data: firm[0],
    };
  } catch (error: any) {
    return {
      success: false,
      code: 500,
      message: "ERROR associate_firm",
      error: error.message,
    };
  }
};

export { search_firms, get_my_firm, create_firm, update_firm, associate_firm };

