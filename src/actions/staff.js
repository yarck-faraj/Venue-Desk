import { editStaff, resetPw } from "../editors/staff.js";

export const staffActions = {
  resetPw: (d) => resetPw(d.k),
  editStaff: (d) => editStaff(d.k),
  addStaff: () => editStaff(null),
};
