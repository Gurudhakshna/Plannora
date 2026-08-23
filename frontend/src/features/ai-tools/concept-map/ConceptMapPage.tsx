import { useState, useMemo } from "react";
import { useApp } from "../../../context/AppContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Select from "../../../components/ui/Select";
import Badge from "../../../components/ui/Badge";
import PageHeader from "../../../components/shared/PageHeader";
import EmptyState from "../../../components/shared/EmptyState";
import LoadingSpinner from "../../../components/shared/LoadingSpinner";
import {
  aiApiService,
  type ConceptMapNode,
  type ConceptMapEdge,
} from "../../../services/aiApiService";

export default function ConceptMapPage() {
  const { materials, aiNotes, handleTeachConcept, handleUpload, showToast } = useApp();

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [customTopic, setCustomTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Map
  const [graphTopic, setGraphTopic] = useState<string>("");
  const [nodes, setNodes] = useState<ConceptMapNode[]>([]);
  const [edges, setEdges] = useState<ConceptMapEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<ConceptMapNode | null>(null);

  // Material select options
  const materialOptions = useMemo(() => {
    return materials.map((m) => ({
      value: m.id,
      label: `${m.title} (${m.type.toUpperCase()})`,
    }));
  }, [materials]);

  // Derive initial concepts from existing analyzed notes if available
  const defaultConcepts = useMemo(() => {
    const list: ConceptMapNode[] = [];
    aiNotes.forEach((n) => {
      if (n.concepts && n.concepts.length > 0) {
        n.concepts.forEach((c, idx) => {
          list.push({
            id: `concept_${n.id}_${idx}`,
            label: c.name,
            description: c.simpleExplanation || c.detailedExplanation || `Core concept from ${n.topic}`,
            importance: (c.priority as "high" | "medium" | "low") || "medium",
            category: c.category || "concept",
          });
        });
      }
    });
    return list;
  }, [aiNotes]);

  // Handle generating real concept graph with Groq
  const handleGenerateGraph = async () => {
    setErrorMsg(null);
    const selectedMat = materials.find((m) => m.id === selectedMaterialId);
    const topic = selectedMat?.title || customTopic.trim();
    const context = selectedMat?.content;

    if (!topic) {
      setErrorMsg("Please select a study material or enter a specific subject.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await aiApiService.generateConceptMap(topic, context);
      if (!res.nodes || res.nodes.length === 0) {
        throw new Error("No concept nodes were generated. Please try again.");
      }

      setGraphTopic(res.topic || topic);
      setNodes(res.nodes);
      setEdges(res.edges || []);
      setSelectedNode(res.nodes[0] || null);
      showToast(`Knowledge graph generated: ${res.nodes.length} concepts and ${res.edges.length} relationships mapped.`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate concept graph.";
      setErrorMsg(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const displayNodes = nodes.length > 0 ? nodes : defaultConcepts;

  return (
    <div>
      <PageHeader
        title="AI Concept Knowledge Graph"
        description="Interactive prerequisite network mapping cognitive dependencies and core conceptual hierarchies."
      />

      {/* GENERATION CONTROLS BAR */}
      <div style={{ marginBottom: 20 }}>
        <Card>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
            {materialOptions.length > 0 && (
              <div style={{ flex: 1, minWidth: 240 }}>
                <label className="form-label" htmlFor="graph-mat-select">
                  Select Study Material
                </label>
                <Select
                  id="graph-mat-select"
                  value={selectedMaterialId}
                  onChange={(e) => {
                    setSelectedMaterialId(e.target.value);
                    if (e.target.value) setCustomTopic("");
                  }}
                >
                  <option value="">— Or enter custom topic —</option>
                  {materialOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {!selectedMaterialId && (
              <div style={{ flex: 1, minWidth: 240 }}>
                <label className="form-label" htmlFor="graph-topic-input">
                  Academic Subject or Topic
                </label>
                <input
                  id="graph-topic-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Operating Systems, Data Structures"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                />
              </div>
            )}

            <Button
              variant="primary"
              size="md"
              onClick={handleGenerateGraph}
              loading={isGenerating}
            >
              Generate AI Graph &rarr;
            </Button>
          </div>

          {errorMsg && (
            <div
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--danger-light)",
                color: "var(--danger-text)",
                fontSize: "12.5px",
              }}
            >
              {errorMsg}
            </div>
          )}
        </Card>
      </div>

      {isGenerating ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <LoadingSpinner size="lg" message="Mapping conceptual dependencies with Groq..." />
        </div>
      ) : displayNodes.length === 0 ? (
        <EmptyState
          title="No concept maps generated yet"
          description="Upload your lecture notes or select a study material above to visualize prerequisite knowledge graphs."
          action={
            <Button variant="primary" size="md" onClick={() => handleUpload("file")}>
              Import Study Material
            </Button>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selectedNode ? "2fr 1.1fr" : "1fr", gap: 20 }}>
          {/* GRAPH CANVAS */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "24px",
              minHeight: 450,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {graphTopic || "Knowledge Graph"}
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {displayNodes.length} Concepts &bull; {edges.length} Relationships
                </h3>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Badge variant="danger">High Priority</Badge>
                <Badge variant="primary">Standard</Badge>
              </div>
            </div>

            {/* Interactive Concept Nodes Cloud */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignContent: "flex-start",
                padding: 12,
                backgroundColor: "var(--bg-inset)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {displayNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id || selectedNode?.label === node.label;
                const isHigh = node.importance === "high";

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 16px",
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: isSelected ? "var(--accent-light)" : "var(--bg-card)",
                      border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                      boxShadow: isSelected ? "var(--accent-glow)" : "var(--shadow-sm)",
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: isHigh ? "var(--danger)" : "var(--accent)",
                      }}
                    />
                    <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {node.label}
                    </span>
                    {node.category && (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        ({node.category})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Relationship Edges Legend */}
            {edges.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  Mapped Dependency Chains:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {edges.map((e, idx) => {
                    const sourceNode = displayNodes.find((n) => n.id === e.source)?.label || e.source;
                    const targetNode = displayNodes.find((n) => n.id === e.target)?.label || e.target;

                    return (
                      <span
                        key={idx}
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          backgroundColor: "var(--bg-elevated)",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <strong>{sourceNode}</strong> &rarr; <span style={{ color: "var(--accent-text)" }}>{e.relationship}</span> &rarr; <strong>{targetNode}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* NODE DETAIL INSPECTOR */}
          {selectedNode && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <Badge variant={selectedNode.importance === "high" ? "danger" : "primary"}>
                    {selectedNode.importance.toUpperCase()} PRIORITY
                  </Badge>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginTop: 8 }}>
                    {selectedNode.label}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                  aria-label="Close inspector"
                >
                  &times;
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Definition / Description
                  </span>
                  <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 4 }}>
                    {selectedNode.description}
                  </p>
                </div>

                {/* Related Edges */}
                {edges.some((e) => e.source === selectedNode.id || e.target === selectedNode.id) && (
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Direct Graph Connections
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                      {edges
                        .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                        .map((e, idx) => {
                          const otherLabel =
                            e.source === selectedNode.id
                              ? displayNodes.find((n) => n.id === e.target)?.label || e.target
                              : displayNodes.find((n) => n.id === e.source)?.label || e.source;

                          return (
                            <div
                              key={idx}
                              style={{
                                fontSize: "12.5px",
                                padding: "6px 10px",
                                backgroundColor: "var(--bg-elevated)",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              {e.source === selectedNode.id ? "Leads to" : "Depends on"}: <strong>{otherLabel}</strong> ({e.relationship})
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <Button
                    variant="primary"
                    size="md"
                    style={{ width: "100%" }}
                    onClick={() => handleTeachConcept(selectedNode.label, graphTopic)}
                  >
                    Teach Me This Concept &rarr;
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
