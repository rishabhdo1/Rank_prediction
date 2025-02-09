const express = require("express");
const {
  analyzePerformance,
  getWeakAreas,
  predictRank,
} = require("../controllers/analysisController");

const router = express.Router();

router.get("/analyze-performance/:userId", analyzePerformance);
router.get("/weak-areas/:userId", getWeakAreas);
router.get("/predict-rank/:userId", predictRank);

module.exports = router;
