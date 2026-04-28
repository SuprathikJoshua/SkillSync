import { Router } from "express";
import {
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
} from "../controllers/user.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middlewares.js";

const router = Router();

router.get("/", verifyJWT, verifyAdmin, getAllUsersController); // admin only
router.get("/:id", verifyJWT, getUserByIdController);
router.put("/:id", verifyJWT, updateUserController);
router.delete("/:id", verifyJWT, verifyAdmin, deleteUserController);

export default router;
