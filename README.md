# Rank_prediction

The requirements of the project:-
We set up the project using npm. 
Node.js – Backend development
Express.js – API framework
MySQL – Storing analyzed results
Axios – Fetching data from external APIs
Dotenv – Environment variable management

Project Overview
This project is a Node. js-based API that analyzes student quiz performance using data fetched in real-time from external APIs. Instead of storing entire quiz and submission datasets in a database, it processes data in memory and only stores essential aggregated results, such as predicted ranks and weak areas, in MySQL.

The API provides three core functionalities:

Performance Analysis – Evaluates student performance based on quiz scores, accuracy, and topic-wise trends.
Weak Areas Identification – Highlights topics where a student needs improvement based on incorrect answers and low accuracy.
Rank Prediction – Estimates a student’s rank using quiz performance and past NEET exam results.


The API used to get the data:-
const QUIZ_API = "https://www.jsonkeeper.com/b/LLQT";
const SUBMISSION_API = "https://api.jsonserve.com/rJvd7g";
const NEET_API = "https://api.jsonserve.com/XgAgFJ";

Logic and Approach
1--Performance Analysis
Fetches user quiz submission data.
Aggregates total score, accuracy, and attempts.
Group performance by quiz topics.
2️--Weak Area Detection
Identifies topics where accuracy < 50% OR incorrect answers are high.
Stores weak topics in MySQL for long-term tracking.
3--Rank Prediction
Uses quiz scores, accuracy, and past NEET exam results.
Compares performance with other students to estimate a percentile rank.

