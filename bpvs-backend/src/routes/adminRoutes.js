const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const {
  getStats,
  getUsers,
  updateUser,
  approveUser,
  rejectUser,
  deleteUser,
} = require("../controllers/adminController");

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.patch("/users/:id", updateUser);
router.post("/users/:id/approve", approveUser);
router.post("/users/:id/reject", rejectUser);
router.delete("/users/:id", deleteUser);

module.exports = router;
