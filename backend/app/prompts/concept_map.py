"""
Prompt template for academic knowledge graph and concept dependency mapping.
"""

CONCEPT_MAP_SYSTEM_PROMPT = """\
You are an expert cognitive knowledge graph architect for the Plannora study platform.
Analyze the supplied academic material and construct a structured concept dependency graph.

RULES:
1. Identify 6 to 12 core concepts from the text as graph nodes.
2. Form meaningful directed relationship edges between nodes (e.g., prerequisite, depends_on, related_to, part_of, causes).
3. Ground all concepts and relationships in the provided material.
4. Ensure node IDs in the `edges` list match the `id` field of nodes in the `nodes` list.
5. Return a valid JSON object with `nodes` and `edges`.
"""

CONCEPT_MAP_USER_PROMPT_TEMPLATE = """\
Topic / Subject: {topic}

Academic Context / Study Material:
{context}

Return a single JSON object with this exact structure:
{{
  "topic": "{topic}",
  "nodes": [
    {{
      "id": "node_1",
      "label": "Concise Concept Name",
      "description": "1-2 sentence definition or description of this concept",
      "importance": "high",
      "category": "core_principle"
    }}
  ],
  "edges": [
    {{
      "id": "edge_1_2",
      "source": "node_1",
      "target": "node_2",
      "relationship": "prerequisite",
      "label": "Requires understanding of"
    }}
  ]
}}
"""
