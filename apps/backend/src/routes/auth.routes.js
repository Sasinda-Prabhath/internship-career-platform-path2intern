import { Router } from "express";
import { register, registerOrg, verify, resend, login, logout, me } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);         // student registers
router.post("/register-org", registerOrg);  // org registers (multipart with PDF)
router.post("/verify", verify);             // email + OTP code
router.post("/resend", resend);             // resend OTP
router.post("/login", login);               // login after verified
router.post("/logout", logout);             // logout
router.get("/me", me);                      // session restoration

export default router;