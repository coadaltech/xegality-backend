// import { InferInsertModel } from "drizzle-orm";
// import db from "../../config/db";
// import { create_unique_id } from "../../utils";
// import { internship_model } from "../../models/shared/internship.model";

// type NewIntern = InferInsertModel<typeof internship_model>;

// const get_interns = async () => {
//   try {
//     const response = await db.select().from(internship_model);

//     if (!response || response.length === 0) {
//       return {
//         success: true,
//         code: 200,
//         message: "No interns found",
//         data: [],
//       };
//     }

//     return {
//       success: true,
//       code: 200,
//       message: "Interns fetched successfully",
//       data: response,
//     };
//   } catch (error) {
//     console.error("fetch_internships error:", error);
//     return {
//       success: false,
//       code: 500,
//       message: "Failed to fetch interns",
//       error: String(error),
//     };
//   }
// };

// // const add_interns = async (body: NewIntern, id: string) => {
// //   try {
// //     if (!id) {
// //       return {
// //         success: false,
// //         code: 400,
// //         message: "Missing employee_id",
// //       };
// //     }
    
// //     const intern_id = create_unique_id();
// //     const {
// //       name,
// //       email,
// //       phone,
// //       university,
// //       year,
// //       specialization,
// //       start_date,
// //       status,
// //       rating,
// //       avatar,
// //       tasks_completed,
// //       hours_worked,
// //       performance,
// //       recent_activity,
// //       supervisor,
// //       department,
// //       contract_type,
// //       salary,
// //     } = body;

// //     const result = await db
// //       .insert(intern_model)
// //       .values({
// //         id: intern_id,
// //         name: name,
// //         email: email,
// //         phone: phone,
// //         university: university,
// //         year: year,
// //         specialization: specialization,
// //         start_date: start_date,
// //         status: status,
// //         rating: rating,
// //         avatar: avatar,
// //         tasks_completed: tasks_completed,
// //         hours_worked: hours_worked,
// //         performance: performance,
// //         recent_activity: recent_activity,
// //         supervisor: supervisor,
// //         department: department,
// //         contract_type: contract_type,
// //         salary: salary,
// //       })
// //       .returning();

// //     return {
// //       success: true,
// //       code: 201,
// //       message: "Intern added successfully",
// //       data: result[0],
// //     };
// //   } catch (error: any) {
// //     console.error("Error adding intern:", error);

// //     // Customize known error responses
// //     if (error.code === "23505") {
// //       return {
// //         success: false,
// //         code: 409,
// //         message: "Duplicate entry: Employer ID or other unique field exists",
// //       };
// //     }

// //     return {
// //       success: false,
// //       code: 500,
// //       message: "Internal server error while adding intern",
// //       error: error?.message || String(error),
// //     };
// //   }
// // };

// export { get_interns, add_interns };
