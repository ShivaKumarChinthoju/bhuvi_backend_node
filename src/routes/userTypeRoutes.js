const express = require("express");
const router = express.Router();
const userTypeContoller = require("../controllers/userTypeController");

router.get("/user-category-type", userTypeContoller.getAllUserTypeCategories);

module.exports = router;
