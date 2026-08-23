import { useState, useMemo } from "react";
import { useApp } from "../../../context/AppContext";
import Button from "../../../components/ui/Button";
import Card, { CardHeader } from "../../../components/ui/Card";
import Select from "../../../components/ui/Select";
import Badge from "../../../components/ui/Badge";
import PageHeader from "../../../components/shared/PageHeader";
import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import {
  aiApiService,
  type QuizQuestion,
  type QuizSubmitResponse,
} from "../../../services/aiApiService";

export default function QuizPage() {
  const { materials, studyPlan, handleTeachConcept, showToast, recordQuizResult } = useApp();

  const [quizState, setQuizState] = useState<"setup" | "generating" | "active" | "submitting" | "results">("setup");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [customSubject, setCustomSubject] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState("5");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active quiz state
  const [generatedQuizId, setGeneratedQuizId] = useState<string>("");
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitResult, setSubmitResult] = useState<QuizSubmitResponse | null>(null);

  // Available study materials
  const materialOptions = useMemo(() => {
    return materials.map((m) => ({
      value: m.id,
      label: `${m.title} (${m.type.toUpperCase()})`,
    }));
  }, [materials]);

  const selectedMaterial = useMemo(() => {
    return materials.find((m) => m.id === selectedMaterialId);
  }, [materials, selectedMaterialId]);

  const currentQuestion = questions[currentQIndex];

  // Handle generating real AI quiz from Groq backend
  const handleStartGenerateQuiz = async () => {
    setErrorMsg(null);
    let subject = customSubject.trim();
    let topic = customTopic.trim();
    let context: string | undefined = undefined;

    if (selectedMaterial) {
      subject = selectedMaterial.topic || studyPlan?.subjects?.[0] || "Study Material";
      topic = selectedMaterial.title;
      context = selectedMaterial.content;
    }

    if (!topic) {
      setErrorMsg("Please select a study material or enter a specific topic.");
      return;
    }

    setQuizState("generating");
    try {
      const count = parseInt(questionCount, 10) || 5;
      const res = await aiApiService.generateQuiz(
        subject || "General",
        topic,
        context,
        count,
        difficulty
      );

      if (!res.questions || res.questions.length === 0) {
        throw new Error("No questions were generated. Please try again.");
      }

      setGeneratedQuizId(res.quiz_id);
      setQuizTitle(res.title || `${topic} Quiz`);
      setQuestions(res.questions);
      setSelectedAnswers({});
      setCurrentQIndex(0);
      setQuizState("active");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate quiz with Groq.";
      setErrorMsg(msg);
      setQuizState("setup");
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex((prev) => prev - 1);
    }
  };

  // Submit quiz to backend for deterministic Python scoring
  const handleSubmitQuiz = async () => {
    setQuizState("submitting");
    try {
      const payloadAnswers = questions.map((q, idx) => ({
        question_id: q.id,
        selected_option: selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1,
        correct_answer: q.correct_answer,
        topic: q.topic || quizTitle,
      }));

      const activeTopic = selectedMaterial?.title || customTopic || "General Topic";
      const activeSubject = selectedMaterial?.topic || customSubject || "Academic Subject";

      const res = await aiApiService.submitQuiz(
        activeTopic,
        payloadAnswers,
        activeSubject,
        generatedQuizId
      );

      setSubmitResult(res);
      setQuizState("results");

      // Record in local state for Weak Topic diagnostics
      recordQuizResult(activeTopic, activeSubject, res.correct, res.total);
      showToast(`Quiz completed! Score: ${res.score}/${res.total} (${res.percentage}%)`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to calculate score.";
      showToast(msg, "error");
      setQuizState("active");
    }
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div>
      <PageHeader
        title="AI Diagnostic Quiz Generator"
        description="Grounded multiple-choice assessments generated from your uploaded notes and evaluated deterministically."
      />

      {/* SETUP VIEW */}
      {quizState === "setup" && (
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Card>
            <CardHeader
              title="Create a New Quiz"
              subtitle="Select study material or specify custom academic topics for Groq generation."
            />

            {errorMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--danger-light)",
                  border: "1px solid var(--danger-border)",
                  color: "var(--danger-text)",
                  fontSize: "13px",
                  marginBottom: 18,
                }}
              >
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {materialOptions.length > 0 && (
                <div className="form-group">
                  <label className="form-label" htmlFor="quiz-material-select">
                    Select Uploaded Study Material (Recommended)
                  </label>
                  <Select
                    id="quiz-material-select"
                    value={selectedMaterialId}
                    onChange={(e) => {
                      setSelectedMaterialId(e.target.value);
                      if (e.target.value) {
                        setCustomTopic("");
                      }
                    }}
                  >
                    <option value="">— Or type a custom topic below —</option>
                    {materialOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {!selectedMaterialId && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="quiz-subject-input">
                      Academic Subject / Course
                    </label>
                    <input
                      id="quiz-subject-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Computer Science, Linear Algebra, Biology"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="quiz-topic-input">
                      Topic or Concept
                    </label>
                    <input
                      id="quiz-topic-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dijkstra's Algorithm, Newton's Laws, Photosynthesis"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="quiz-diff-select">
                    Difficulty
                  </label>
                  <Select
                    id="quiz-diff-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="Easy">Easy (Definitions & Recall)</option>
                    <option value="Medium">Medium (Application)</option>
                    <option value="Hard">Hard (Analytical Problem Solving)</option>
                  </Select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="quiz-count-select">
                    Question Count
                  </label>
                  <Select
                    id="quiz-count-select"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                  >
                    <option value="3">3 Questions (Quick Check)</option>
                    <option value="5">5 Questions (Standard)</option>
                    <option value="10">10 Questions (Comprehensive)</option>
                  </Select>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <Button
                  variant="primary"
                  size="lg"
                  style={{ width: "100%" }}
                  onClick={handleStartGenerateQuiz}
                >
                  Generate AI Quiz with Groq &rarr;
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* GENERATING / LOADING VIEW */}
      {quizState === "generating" && (
        <div style={{ maxWidth: 500, margin: "60px auto", textAlign: "center" }}>
          <Card>
            <div style={{ padding: "40px 20px" }}>
              <LoadingSpinner size="lg" message="Synthesizing multiple-choice questions..." />
              <p style={{ marginTop: 16, fontSize: "13px", color: "var(--text-secondary)" }}>
                Plannora AI is analyzing concepts from your material and formulating rigorous diagnostic questions.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ACTIVE QUIZ VIEW */}
      {(quizState === "active" || quizState === "submitting") && currentQuestion && (
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Header Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {quizTitle}
              </span>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                Question {currentQIndex + 1} of {questions.length}
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Badge variant="neutral">
                {answeredCount}/{questions.length} Answered
              </Badge>
              <Badge variant="primary">{difficulty}</Badge>
            </div>
          </div>

          {/* Question Card */}
          <Card>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: 20, lineHeight: 1.5 }}>
              {currentQuestion.question}
            </div>

            {/* 4 MCQ Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentQuestion.options.map((optionText, optIdx) => {
                const isSelected = selectedAnswers[currentQIndex] === optIdx;
                const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 18px",
                      borderRadius: "var(--radius-lg)",
                      border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                      backgroundColor: isSelected ? "var(--accent-light)" : "var(--bg-card)",
                      color: "var(--text-primary)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "var(--radius-md)",
                        backgroundColor: isSelected ? "var(--accent)" : "var(--bg-elevated)",
                        color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {letter}
                    </span>
                    <span style={{ fontSize: "14px", lineHeight: 1.4 }}>{optionText}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
              <Button
                variant="secondary"
                size="md"
                onClick={handlePrev}
                disabled={currentQIndex === 0}
              >
                &larr; Previous
              </Button>

              <div style={{ display: "flex", gap: 10 }}>
                {currentQIndex < questions.length - 1 ? (
                  <Button variant="primary" size="md" onClick={handleNext}>
                    Next Question &rarr;
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSubmitQuiz}
                    loading={quizState === "submitting"}
                  >
                    Submit Quiz &rarr;
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* RESULTS VIEW */}
      {quizState === "results" && submitResult && (
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Summary Score Card */}
          <Card>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: submitResult.percentage >= 75 ? "var(--success-light)" : "var(--warning-light)",
                  color: submitResult.percentage >= 75 ? "var(--success-text)" : "var(--warning-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 700,
                  margin: "0 auto 16px auto",
                  border: `2px solid ${submitResult.percentage >= 75 ? "var(--success)" : "var(--warning)"}`,
                }}
              >
                {submitResult.percentage}%
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                Score: {submitResult.score} / {submitResult.total}
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto 16px auto" }}>
                {submitResult.message}
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <Button variant="primary" size="md" onClick={() => setQuizState("setup")}>
                  Take Another Quiz
                </Button>
              </div>
            </div>
          </Card>

          {/* Topic Performance Breakdown */}
          {submitResult.topic_performance.length > 0 && (
            <Card>
              <CardHeader title="Topic Performance Breakdown" />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {submitResult.topic_performance.map((tp, idx) => (
                  <div key={idx} style={{ padding: "10px 14px", backgroundColor: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {tp.topic}
                      </span>
                      <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                        {tp.correct}/{tp.total} ({tp.accuracy}%)
                      </span>
                    </div>
                    <div style={{ height: 6, backgroundColor: "var(--bg-hover)", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${tp.accuracy}%`,
                          backgroundColor: tp.accuracy >= 75 ? "var(--success)" : tp.accuracy >= 50 ? "var(--warning)" : "var(--danger)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Detailed Question Review */}
          <Card>
            <CardHeader title="Detailed Question Review" subtitle="Review explanations grounded in your material." />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {questions.map((q, idx) => {
                const userChoice = selectedAnswers[idx];
                const isCorrect = userChoice === q.correct_answer;

                return (
                  <div
                    key={q.id}
                    style={{
                      padding: "16px",
                      borderRadius: "var(--radius-lg)",
                      border: `1px solid ${isCorrect ? "var(--success-border)" : "var(--danger-border)"}`,
                      backgroundColor: isCorrect ? "var(--success-light)" : "var(--danger-light)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {idx + 1}. {q.question}
                      </span>
                      <Badge variant={isCorrect ? "success" : "danger"}>
                        {isCorrect ? "Correct (+1)" : "Incorrect (0)"}
                      </Badge>
                    </div>

                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: 8 }}>
                      <strong>Your Answer:</strong> {userChoice !== undefined ? `${String.fromCharCode(65 + userChoice)}) ${q.options[userChoice]}` : "None selected"}
                    </div>

                    {!isCorrect && (
                      <div style={{ fontSize: "13px", color: "var(--success-text)", marginBottom: 8 }}>
                        <strong>Correct Answer:</strong> {String.fromCharCode(65 + q.correct_answer)}) {q.options[q.correct_answer]}
                      </div>
                    )}

                    <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: 6, fontStyle: "italic" }}>
                      💡 <strong>Explanation:</strong> {q.explanation}
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTeachConcept(q.topic || q.question)}
                      >
                        Teach Me This Concept &rarr;
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
