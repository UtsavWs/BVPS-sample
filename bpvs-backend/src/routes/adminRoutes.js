const express = require("express");
const router = express.Router();
const {
  protect,
  adminOnly,
  adminOrSubadmin,
} = require("../middlewares/authMiddleware");
const {
  getStats,
  getUsers,
  updateUser,
  approveUser,
  rejectUser,
  deleteUser,
  promoteToSubadmin,
  demoteToMember,
  getSubadmins,
} = require("../controllers/adminController");

router.use(protect);

// Shared: admin + subadmin can view and manage members
router.get("/stats", adminOrSubadmin, getStats);
router.get("/users", adminOrSubadmin, getUsers);
router.patch("/users/:id", adminOrSubadmin, updateUser);
router.post("/users/:id/approve", adminOrSubadmin, approveUser);
router.post("/users/:id/reject", adminOrSubadmin, rejectUser);

// Admin-only: role management + deletion
router.get("/subadmins", adminOnly, getSubadmins);
router.post("/users/:id/promote", adminOnly, promoteToSubadmin);
router.post("/users/:id/demote", adminOnly, demoteToMember);
router.delete("/users/:id", adminOrSubadmin, deleteUser);

module.exports = router;
