# DLW-Hackathon-Foon-Yew-International-Team-
This repository contains our project developed during Deep Learning Week Hackathon (1/3/2026). The objective of the hackathon was to apply deep learning techniques to solve a real-world problem within a limited timeframe.

Why It’s Different?
LockedIn Buddy was designed with a single objective: transform passive reading into structured, active learning. Instead of simply summarizing webpages, the system follows a carefully engineered methodology that extracts, organizes, tests, and reinforces knowledge in a measurable way.
Our Methodology
When a user opens a webpage, LockedIn Buddy intelligently processes the content before sending anything to the AI. We remove noise (scripts, media, UI clutter) and extract only meaningful text. If the user highlights a section, the system prioritizes that selection and captures relevant surrounding context to maintain accuracy.
To ensure reliability and reduce hallucination risk, content is divided into citeable text segments. Every AI output must reference these segments. This structured preprocessing layer significantly improves transparency and trust.
Core Methodological Principles:
•
Clean content extraction from the active tab
•
Highlight-first prioritization for contextual learning
•
Source chunking with citeable IDs (S1, S2, etc.)
•
Strict structured JSON output enforcement
•
Controlled token limits for stability and cost efficiency
Our Approach
LockedIn Buddy is not just an AI wrapper — it is a controlled learning pipeline. Every AI response is required to return in structured JSON format before rendering. This prevents unpredictable formatting and ensures a consistent user experience. The extension supports multiple learning modes:
•
Topic-Based Summaries Dynamically generated headings with key study points.
•
Active Recall Quiz System 10 structured MCQs with explanations and weak-topic tracking.
•
Mind map Generator Hierarchical visualization of core ideas and subtopics.
•
Highlight Assistant Adaptive explanation styles:
o
Beginner-friendly
o
Exam-focused
o
Analogy-based
o
Mnemonic-driven
o
Balanced student mode
•
Focus Session (Pomodoro + Attention Heuristic) Optional camera-based distraction detection processed locally for privacy.
Results Achieved
Instead of producing static summaries, LockedIn Buddy creates a full learning loop:
•
Read → Summarize → Test → Analyze Weakness → Reinforce → Track Progress
Users receive:
•
Structured topic summaries
•
Interactive quizzes with instant feedback
•
Weak-area detection and AI coaching
•
Visual mindmaps
•
Performance analytics dashboard
•
Focus tracking with streak measurement
Testing Procedures
We conducted structured testing across academic articles, lecture notes, and long-form web content.
Test Coverage Included:
•
Short content (<120 characters)
•
Long content (>16,000 characters)
•
Restricted Chrome pages
•
Missing API keys
•
Malformed AI responses
•
Camera permission denial
•
Multiple consecutive quiz sessions
•
Dark/light theme switching
Error handling was implemented at multiple levels:
•
JSON parsing safeguards
•
Chrome permission validation
•
Graceful API error feedback
•
Restricted page detection
Observations
During development and validation, we identified several critical insights:
•
Chunk-based citation significantly reduces hallucinated references.
•
Strict JSON enforcement dramatically improves output stability.
•
Users prefer highlight-based micro-learning over full-page summarization.
•
Combining quizzes with weak-topic analytics increases engagement.
•
Lightweight pixel-based focus detection works reliably in normal lighting conditions but is sensitive in low light.
Key Findings
The most important discovery was that AI performance improves dramatically when wrapped inside a structured control system.
Problem Identified
Design Decision
Outcome
Hallucinated references
Source chunk IDs with enforced citation
Improved transparency and trust
Unstable AI formatting
Strict JSON-only responses
Reliable rendering and parsing
Passive reading behaviour
Interactive quiz + weak-topic detection
Increased retention and engagement
Loss of focus
Pomodoro + heuristic reminders
Behavioural reinforcement
No progress visibility
Built-in analytics dashboard
Measurable improvement tracking
Summary of Current Constraints
Area
Limitation
Focus Detection
Detects face presence only, not eye tracking
AI Model
Uses lightweight GPT variant (limited deep reasoning)
File Support
Cannot directly read PDF files
Mathematics
Struggles with heavy symbolic and equation-based content
Conclusion
LockedIn Buddy demonstrates that AI becomes significantly more powerful when combined with structure, validation, and behavioral reinforcement. By integrating controlled content extraction, structured AI outputs, interactive recall testing, analytics tracking, and focus monitoring, we created a complete learning workflow — not just a summarization tool.
It doesn’t just summarize webpages. It builds a repeatable, measurable system for thinking, testing, focusing, and improvin
