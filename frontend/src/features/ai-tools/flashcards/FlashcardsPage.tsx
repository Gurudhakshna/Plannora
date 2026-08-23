import { useState, useMemo, useEffect, useCallback } from "react";
import { useApp } from "../../../context/AppContext";
import Button from "../../../components/ui/Button";
import Card, { CardHeader } from "../../../components/ui/Card";
import Select from "../../../components/ui/Select";
import Badge from "../../../components/ui/Badge";
import PageHeader from "../../../components/shared/PageHeader";
import EmptyState from "../../../components/shared/EmptyState";
import { aiApiService, type Flashcard } from "../../../services/aiApiService";

export default function FlashcardsPage() {
  const { materials, aiNotes, handleUpload, showToast, recordFlashcardRating } = useApp();

  const [mode, setMode] = useState<"review" | "generate">("review");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [customTopic, setCustomTopic] = useState("");
  const [cardCount, setCardCount] = useState("10");
  const [difficulty, setDifficulty] = useState("Medium");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Flashcards Deck
  const [customDeck, setCustomDeck] = useState<Flashcard[] | null>(null);
  const [deckTitle, setDeckTitle] = useState("Study Flashcards");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Material select options
  const materialOptions = useMemo(() => {
    return materials.map((m) => ({
      value: m.id,
      label: `${m.title} (${m.type.toUpperCase()})`,
    }));
  }, [materials]);

  // Derive initial flashcards from analyzed notes definitions & formulas if available
  const defaultDeck: Flashcard[] = useMemo(() => {
    const generated: Flashcard[] = [];
    aiNotes.forEach((n) => {
      if (n.definitions && n.definitions.length > 0) {
        n.definitions.forEach((d, idx) => {
          generated.push({
            id: `def-${n.id}-${idx}`,
            front: `Define: ${d.term}`,
            back: d.definition,
            topic: n.topic,
            difficulty: "medium",
          });
        });
      }
      if (n.formulas && n.formulas.length > 0) {
        n.formulas.forEach((f, idx) => {
          generated.push({
            id: `form-${n.id}-${idx}`,
            front: `Formula for: ${f.name}`,
            back: `${f.formula}${f.when ? ` (When to use: ${f.when})` : ""}`,
            topic: n.topic,
            difficulty: "medium",
          });
        });
      }
    });

    return generated;
  }, [aiNotes]);

  const activeDeck = customDeck || defaultDeck;
  const currentCard = activeDeck[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < activeDeck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, activeDeck.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Keyboard Shortcuts: Space to flip, Left/Right for prev/next
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

  // Generate Deck via Groq Backend
  const handleGenerateDeck = async () => {
    setErrorMsg(null);
    const selectedMat = materials.find((m) => m.id === selectedMaterialId);
    const topic = selectedMat?.title || customTopic.trim();
    const context = selectedMat?.content;

    if (!topic) {
      setErrorMsg("Please select a study material or enter a specific topic.");
      return;
    }

    setIsGenerating(true);
    try {
      const count = parseInt(cardCount, 10) || 10;
      const res = await aiApiService.generateFlashcards(
        topic,
        context,
        count,
        difficulty
      );

      if (!res.cards || res.cards.length === 0) {
        throw new Error("No flashcards were generated. Please try again.");
      }

      setCustomDeck(res.cards);
      setDeckTitle(res.title || `${topic} Flashcards`);
      setCurrentIndex(0);
      setIsFlipped(false);
      setMode("review");
      showToast(`Generated ${res.cards.length} flashcards with Groq!`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate flashcards.";
      setErrorMsg(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle rating a flashcard (Easy, Medium, Hard)
  const handleRateCard = async (rating: "easy" | "medium" | "hard") => {
    if (!currentCard) return;

    try {
      await aiApiService.rateFlashcard(currentCard.id, rating, currentCard.topic);
      recordFlashcardRating(currentCard.topic, rating);
      showToast(`Marked as ${rating.toUpperCase()}`, "success");
      handleNext();
    } catch {
      handleNext();
    }
  };

  if (activeDeck.length === 0 && mode === "review") {
    return (
      <div>
        <PageHeader
          title="Active Recall Flashcards"
          description="Spaced-repetition flashcards grounded in your uploaded materials."
          action={
            <Button variant="primary" size="md" onClick={() => setMode("generate")}>
              + Generate Deck with Groq
            </Button>
          }
        />
        <EmptyState
          title="No flashcards generated yet"
          description="Upload your study materials or generate a custom deck with Groq AI to start active recall revision."
          action={
            <div style={{ display: "flex", gap: 12 }}>
              <Button variant="secondary" size="md" onClick={() => handleUpload("file")}>
                Import Material
              </Button>
              <Button variant="primary" size="md" onClick={() => setMode("generate")}>
                Generate AI Flashcards
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Active Recall Flashcards"
        description="Spaced-repetition flashcards grounded in your uploaded course materials."
        action={
          <div style={{ display: "flex", gap: 10 }}>
            {mode === "review" ? (
              <Button variant="secondary" size="md" onClick={() => setMode("generate")}>
                + Generate New Deck
              </Button>
            ) : (
              <Button variant="ghost" size="md" onClick={() => setMode("review")}>
                &larr; Back to Flashcards
              </Button>
            )}
          </div>
        }
      />

      {/* GENERATE DECK VIEW */}
      {mode === "generate" && (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <Card>
            <CardHeader
              title="Generate Flashcard Deck"
              subtitle="Groq will extract high-yield active recall questions from your materials."
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
                  marginBottom: 16,
                }}
              >
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {materialOptions.length > 0 && (
                <div className="form-group">
                  <label className="form-label" htmlFor="flashcard-mat-select">
                    Select Study Material (Recommended)
                  </label>
                  <Select
                    id="flashcard-mat-select"
                    value={selectedMaterialId}
                    onChange={(e) => {
                      setSelectedMaterialId(e.target.value);
                      if (e.target.value) setCustomTopic("");
                    }}
                  >
                    <option value="">— Or enter custom topic below —</option>
                    {materialOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {!selectedMaterialId && (
                <div className="form-group">
                  <label className="form-label" htmlFor="flashcard-topic-input">
                    Academic Topic or Subject
                  </label>
                  <input
                    id="flashcard-topic-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Data Structures, Cell Biology, Thermodynamics"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="flashcard-diff-select">
                    Difficulty
                  </label>
                  <Select
                    id="flashcard-diff-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="Easy">Easy (Foundational)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="Hard">Hard (Advanced Nuances)</option>
                  </Select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="flashcard-count-select">
                    Card Count
                  </label>
                  <Select
                    id="flashcard-count-select"
                    value={cardCount}
                    onChange={(e) => setCardCount(e.target.value)}
                  >
                    <option value="5">5 Cards</option>
                    <option value="10">10 Cards</option>
                    <option value="15">15 Cards</option>
                  </Select>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <Button
                  variant="primary"
                  size="lg"
                  style={{ width: "100%" }}
                  onClick={handleGenerateDeck}
                  loading={isGenerating}
                >
                  {isGenerating ? "Synthesizing Flashcards with Groq..." : "Generate AI Flashcards \u2192"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* FLASHCARD REVIEW VIEW */}
      {mode === "review" && currentCard && (
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Deck Progress Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {deckTitle}
              </span>
              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                Card {currentIndex + 1} of {activeDeck.length}
              </h4>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Badge variant="neutral">{currentCard.topic}</Badge>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={handleFlip}
            style={{
              minHeight: 280,
              perspective: 1000,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                minHeight: 280,
                textAlign: "center",
                transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front Side */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-xl)",
                  padding: "36px 28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                <span style={{ fontSize: "11.5px", textTransform: "uppercase", color: "var(--accent-text)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 16 }}>
                  Question / Concept
                </span>
                <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.5, maxWidth: 500 }}>
                  {currentCard.front}
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 24 }}>
                  Click card or press <kbd style={{ padding: "2px 6px", background: "var(--bg-elevated)", borderRadius: 4 }}>Space</kbd> to flip &rarr;
                </span>
              </div>

              {/* Back Side */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: "var(--radius-xl)",
                  padding: "36px 28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transform: "rotateY(180deg)",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                <span style={{ fontSize: "11.5px", textTransform: "uppercase", color: "var(--success-text)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 16 }}>
                  Answer & Explanation
                </span>
                <div style={{ fontSize: "16px", color: "var(--text-primary)", lineHeight: 1.6, maxWidth: 520 }}>
                  {currentCard.back}
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 24 }}>
                  Click to flip back &larr;
                </span>
              </div>
            </div>
          </div>

          {/* Difficulty Rating Buttons (When Flipped) */}
          {isFlipped && (
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 4 }}>
              <Button
                variant="secondary"
                size="md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRateCard("hard");
                }}
                style={{ borderColor: "var(--danger-border)", color: "var(--danger-text)" }}
              >
                Hard (Needs Review)
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRateCard("medium");
                }}
                style={{ borderColor: "var(--warning-border)", color: "var(--warning-text)" }}
              >
                Good (Medium)
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRateCard("easy");
                }}
                style={{ borderColor: "var(--success-border)", color: "var(--success-text)" }}
              >
                Easy (Mastered)
              </Button>
            </div>
          )}

          {/* Bottom Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <Button
              variant="secondary"
              size="md"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              &larr; Previous Card
            </Button>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Keyboard: <kbd style={{ padding: "2px 6px", background: "var(--bg-elevated)", borderRadius: 4 }}>&larr;</kbd> <kbd style={{ padding: "2px 6px", background: "var(--bg-elevated)", borderRadius: 4 }}>&rarr;</kbd>
            </span>
            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              disabled={currentIndex === activeDeck.length - 1}
            >
              Next Card &rarr;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
