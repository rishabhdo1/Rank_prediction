const axios = require("axios");
const pool = require("../config/db");

const QUIZ_API = "https://www.jsonkeeper.com/b/LLQT";
const SUBMISSION_API = "https://api.jsonserve.com/rJvd7g";
const NEET_API = "https://api.jsonserve.com/XgAgFJ";

// Fetch data from API

async function fetchData(url) {
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data && !Array.isArray(data)) {
      return [data]; // object to an array
    }

    return data || [];
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    return [];
  }
}

//Task 1
exports.analyzePerformance = async (req, res) => {
  const userId = req.params.userId;
  console.log(`Checking submissions for User ID: ${userId}`);

  try {
    console.log("Fetching submissions of the User ");
    const response = await axios.get("https://api.jsonserve.com/rJvd7g");

    let submission = response.data; // Single object, not an array

    let submissions = Array.isArray(submission) ? submission : [submission];

    console.log(`Total submissions fetched: ${submissions.length}`);

    const userSubmissions = submissions.filter(
      (sub) => sub.user_id?.trim() === userId.trim()
    );

    if (userSubmissions.length === 0) {
      console.error(`No submissions found for user (${userId}).`);
      return res
        .status(404)
        .json({ error: `No submissions found for this user (${userId})` });
    }
    let totalScore = 0,
      totalAccuracy = 0,
      attempts = userSubmissions.length;
    let topicPerformance = {};

    userSubmissions.forEach((sub) => {
      totalScore += sub.score;
      totalAccuracy += parseFloat(sub.accuracy);

      if (!topicPerformance[sub.quiz_id]) topicPerformance[sub.quiz_id] = [];
      topicPerformance[sub.quiz_id].push(sub.score);
    });

    const avgScore = attempts > 0 ? totalScore / attempts : 0;
    const avgAccuracy = attempts > 0 ? totalAccuracy / attempts : 0;

    res.json({ userId, avgScore, avgAccuracy, topicPerformance });
  } catch (error) {
    console.error("Error analyzing performance:", error.message);
    res.status(500).json({ error: "Error analyzing performance" });
  }
};

//Task 2
exports.getWeakAreas = async (req, res) => {
  const userId = req.params.userId;

  try {
    const submissions = await fetchData(SUBMISSION_API);
    if (!submissions)
      return res.status(500).json({ error: "Failed to fetch submissions" });

    const userSubmissions = submissions.filter((sub) => sub.user_id === userId);
    let weakTopics = {};

    userSubmissions.forEach((sub) => {
      if (sub.incorrect_answers > 0) {
        // If user made mistakes
        const topic = sub.quiz?.topic || `Quiz ${sub.quiz_id}`; // Extract topic name
        if (!weakTopics[topic]) weakTopics[topic] = [];

        // Get incorrect question IDs
        const questionIds = Object.keys(sub.response_map).map((qid) =>
          parseInt(qid)
        );
        const incorrectQuestions = questionIds.slice(sub.correct_answers); 

        incorrectQuestions.forEach((questionId) => {
          weakTopics[topic].push({
            questionId: questionId,
            selectedOption: sub.response_map[questionId],
          });
        });
      }
    });
    const sql = `UPDATE user_performance SET weak_topics = ? WHERE user_id = ?`;
    await pool.query(sql, [JSON.stringify(weakTopics), userId]);

    res.json({ userId, weakTopics });
  } catch (error) {
    console.error("Error analyzing weak areas:", error.message);
    res.status(500).json({ error: "Error analyzing weak areas" });
  }
};

// Task 3
exports.predictRank = async (req, res) => {
  const userId = req.params.userId;

  try {
    const submissions = await fetchData(SUBMISSION_API);
    const neetResults = await fetchData(NEET_API);

    if (!submissions || !neetResults)
      return res.status(500).json({ error: "Failed to fetch data" });

    const userSubmissions = submissions.filter((sub) => sub.user_id === userId);
    const userNeetResults = neetResults.filter((sub) => sub.user_id === userId);

    let avgQuizScore =
      userSubmissions.reduce((sum, sub) => sum + sub.score, 0) /
        userSubmissions.length || 0;
    let avgNeetScore =
      userNeetResults.reduce((sum, sub) => sum + sub.score, 0) /
        userNeetResults.length || 0;

    let predictedRank = Math.round((10000 - avgNeetScore) / 100);

    const sql = `INSERT INTO user_performance (user_id, avg_quiz_score, avg_neet_score, predicted_rank)
                 VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE avg_quiz_score=VALUES(avg_quiz_score),
                 avg_neet_score=VALUES(avg_neet_score), predicted_rank=VALUES(predicted_rank)`;
    await pool.query(sql, [userId, avgQuizScore, avgNeetScore, predictedRank]);

    res.json({ userId, avgQuizScore, avgNeetScore, predictedRank });
  } catch (error) {
    res.status(500).json({ error: "Error predicting rank" });
  }
};
