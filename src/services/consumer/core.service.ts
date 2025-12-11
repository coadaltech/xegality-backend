import db from "@/config/db";
import {
  consumer_profile_model,
  UpdateConsumerWithUserType,
} from "@/models/consumer/consumer.model";
import { user_model } from "@/models/shared/user.model";
import { undefinedToNull } from "@/utils/ts.utils";
import { getTableColumns, eq, and } from "drizzle-orm";

const get_consumer_profile = async (id: number) => {
  const userColumns = getTableColumns(user_model);
  const consumerColumns = getTableColumns(consumer_profile_model);
  // destructure to drop unwanted ones
  const {
    id: userId,
    role,
    created_at,
    refresh_token,
    hashed_password,
    ...safeUserColumns
  } = userColumns;
  const { id: consumerId, ...safeConsumerColumns } = consumerColumns;

  try {
    const result = await db
      .select({
        ...safeUserColumns,
        ...safeConsumerColumns,
      })
      .from(user_model)
      .leftJoin(
        consumer_profile_model,
        eq(user_model.id, consumer_profile_model.id)
      )
      .where(and(eq(user_model.id, id), eq(user_model.isdeleted, false)))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Consumer profile not found",
      };
    }

    const profile = result[0];

    return {
      success: true,
      code: 200,
      message: "Consumer profile fetched successfully",
      data: profile,
    };
  } catch (error) {
    console.error("ERROR get_consumer_profile:", error);
    return {
      success: false,
      code: 500,
      message: "ERROR get_consumer_profile",
      error,
    };
  }
};

const update_consumer_profile = async (
  id: number,
  profile: UpdateConsumerWithUserType
) => {
  try {
    if (profile.name) {
      // name is not part of the consumer profile, so we don't update it here
      const user_update_result = await db
        .update(user_model)
        .set({ name: profile.name })
        .where(eq(user_model.id, id))
        .returning();

      if (user_update_result.length === 0) {
        return {
          success: false,
          code: 404,
          message: "Could not update user name, user not found",
        };
      }
    }

    const refined_profile = undefinedToNull(profile);
    // Attempt update
    const update_result = await db
      .update(consumer_profile_model)
      .set({
        gender: refined_profile.gender,
        marital_status: refined_profile.marital_status,
        age: refined_profile.age,
        home_address: refined_profile.home_address,
        postal_pincode: refined_profile.postal_pincode,
        profile_picture: refined_profile.profile_picture,
      })
      .where(eq(consumer_profile_model.id, id))
      .returning();

    if (update_result.length > 0) {
      return {
        success: true,
        code: 200,
        message: "Consumer profile updated successfully",
        data: update_result[0],
      };
    }

    // Validate required fields before inserting
    if (!profile.gender || !profile.age) {
      return {
        success: false,
        code: 400,
        message: "Failed to create profile, missing All required fields",
      };
    }

    // Insert new consumer profile
    const insert_result = await db
      .insert(consumer_profile_model)
      .values({
        id: id,
        gender: profile.gender,
        age: profile.age,
        marital_status: profile.marital_status,
        home_address: profile.home_address,
        postal_pincode: profile.postal_pincode,
        profile_picture: profile.profile_picture,
      })
      .returning();

    // Mark user as profile completed
    await db
      .update(user_model)
      .set({ is_profile_complete: true })
      .where(eq(user_model.id, id));

    return {
      success: true,
      code: 201,
      message: "Consumer profile created successfully",
      data: insert_result[0],
    };
  } catch (error: any) {
    return {
      success: false,
      code: 500,
      message: "ERROR update_consumer_profile",
      error: error.message,
    };
  }
};

export { get_consumer_profile, update_consumer_profile };
