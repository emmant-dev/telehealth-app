import { IUser } from "../models/User";

export const sanitizeUser = (user: IUser) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role
});
