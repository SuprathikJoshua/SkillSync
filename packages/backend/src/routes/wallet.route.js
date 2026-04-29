import { Router } from "express";
import {
  getWalletController,
  transferTokensController,
  rewardTokensController,
  getTransactionsController,
} from "../controllers/wallet.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middlewares.js";

const router = Router();

router.get("/", verifyJWT, getWalletController);
router.post("/transfer", verifyJWT, transferTokensController);
router.post("/reward", verifyJWT, verifyAdmin, rewardTokensController); // admin only
router.get("/transactions", verifyJWT, getTransactionsController);

export default router;
