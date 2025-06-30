import {
    InferInsertModel,
    ilike,
    or,
    lt,
    sql,
    eq,
    ne,
    and,
    isNull,
} from "drizzle-orm";
import db from "../../config/db";
import { case_model, } from "../../models/shared/case.model";
import { PostCaseType } from "../../types/app.types";
import { create_unique_id } from "../../utils";


export const get_cases = async (id: number) => {
    try {
        const case_opportunities = await db.select().from(case_model).where(eq(case_model.assigned_by, id))
        if (!case_opportunities) {
            return {
                success: true,
                code: 200,
                message: `No Cases Found`,
                data: [],
            };
        }
        return {
            success: true,
            code: 200,
            message: `Total ${case_opportunities.length} Cases Found`,
            data: case_opportunities,
        };
    } catch (error) {
        console.error("get_cases error:", error);
        return {
            success: false,
            code: 500,
            message: "Failed to get cases",
            error: String(error),
        };
    }
};
export const create_case = async (body: PostCaseType, assigned_by_id: number) => {
    try {
        const result = await db
            .insert(case_model)
            .values({
                assigned_to: body.assigned_to,
                open_date: body.open_date,
                description: body.description,
                assigned_by: assigned_by_id,
                client_name: body.client_name,
                client_address: body.client_address,
                client_age: body.client_age,
                phone: body.phone
            })
            .returning();

        return {
            success: true,
            code: 201,
            message: "Case added successfully",
            data: result[0],
        };
    } catch (error: any) {
        console.error("Error adding case:", error);

        // Customize known error responses
        if (error.code === "23505") {
            return {
                success: false,
                code: 409,
                message: "Duplicate entry: Case ID or other unique field exists",
            };
        }

        return {
            success: false,
            code: 500,
            message: "Internal server error while adding case",
            error: error?.message || String(error),
        };
    }
};
