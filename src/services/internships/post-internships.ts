import { create_internship } from "../../services/shared/internship.service";
import { InternshipType } from "../../types/app.types";

export const add_internship = async (
  body: InternshipType,
  id: string,
  role: string
) => {
  try {
    const internshiup_id = `${Date.now()}${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const create_internship_resposne = await create_internship(
      body,
      internshiup_id,
      id,
      role
    );
    return {
      success: create_internship_resposne.success,
      code: create_internship_resposne.code,
      message: create_internship_resposne.message,
      data: create_internship_resposne.data,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Error: add_internship",
    };
  }
};
