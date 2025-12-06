import db from "../../config/db";
import { user_model } from "../../models/shared/user.model";
import { eq, like, or, desc, count } from "drizzle-orm";

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  suspendedUsers: number;
  usersByRole: Record<string, number>;
}

export const getUsersWithFilters = async (filters: UserFilters) => {
  try {
    const { page = 1, limit = 10, search, role, status } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = [];

    // Search filter
    if (search) {
      whereConditions.push(
        or(
          like(user_model.name, `%${search}%`),
          like(user_model.email, `%${search}%`)
        )
      );
    }

    // Role filter
    if (role && role !== "all") {
      whereConditions.push(eq(user_model.role, role));
    }

    // Get users
    const users = await db
      .select({
        id: user_model.id,
        name: user_model.name,
        email: user_model.email,
        phone: user_model.phone,
        role: user_model.role,
        is_profile_complete: user_model.is_profile_complete,
        credits: user_model.credits,
        created_at: user_model.created_at,
      })
      .from(user_model)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
      .orderBy(desc(user_model.created_at))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(user_model)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined);

    const total = totalResult[0]?.count || 0;

    return {
      success: true,
      data: {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, message: "Failed to fetch users" };
  }
};

export const getUserStats = async (): Promise<{
  success: boolean;
  data?: UserStats;
  message?: string;
}> => {
  try {
    // Total users
    const totalUsers = await db.select({ count: count() }).from(user_model);

    // Users by role
    const usersByRole = await db
      .select({
        role: user_model.role,
        count: count(),
      })
      .from(user_model)
      .groupBy(user_model.role);

    // Active users (profile complete)
    const activeUsers = await db
      .select({ count: count() })
      .from(user_model)
      .where(eq(user_model.is_profile_complete, true));

    // New users this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await db
      .select({ count: count() })
      .from(user_model)
      .where(`created_at >= '${thisMonth.toISOString()}'`);

    return {
      success: true,
      data: {
        totalUsers: totalUsers[0]?.count || 0,
        activeUsers: activeUsers[0]?.count || 0,
        newUsersThisMonth: newUsersThisMonth[0]?.count || 0,
        suspendedUsers: 0,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item.count;
          return acc;
        }, {} as Record<string, number>),
      },
    };
  } catch (error) {
    return { success: false, message: "Failed to fetch user statistics" };
  }
};
