const express = require("express");
const router = express.Router();
const {
  protect,
  adminOnly,
  adminOrSubadmin,
} = require("../middlewares/authMiddleware");
const {
  validate,
  createUserSchema,
} = require("../middlewares/validationMiddleware");
const {
  getAdminStats,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  promoteToSubadmin,
  demoteToMember,
  getSubadmins,
} = require("../controllers/adminController");

router.use(protect);

// Shared: admin + subadmin can view and manage members
router.get("/stats", adminOrSubadmin, getAdminStats);
router.get("/users", adminOrSubadmin, getUsers);
router.post("/users", adminOrSubadmin, validate(createUserSchema), createUser);
router.patch("/users/:id", adminOrSubadmin, updateUser);

// Admin-only: role management + deletion
router.get("/subadmins", adminOnly, getSubadmins);
router.post("/users/:id/promote", adminOnly, promoteToSubadmin);
router.post("/users/:id/demote", adminOnly, demoteToMember);
router.delete("/users/:id", adminOrSubadmin, deleteUser);

module.exports = router;
