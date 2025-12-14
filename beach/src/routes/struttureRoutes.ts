import express from "express";
import {
  getStrutture,
  getStrutturaById,
} from "../controllers/struttureController";

const router = express.Router();

router.get("/", getStrutture);
router.get("/:id", getStrutturaById);

export default router;
