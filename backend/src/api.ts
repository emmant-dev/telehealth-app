import { connectDatabase } from "./config/database";
import { app } from "./app";

connectDatabase();

export default app;