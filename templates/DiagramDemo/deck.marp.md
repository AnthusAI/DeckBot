---
marp: true
theme: default
size: 16:9
paginate: true
---

# Diagram Support Demo

## Mermaid and Excalidraw Examples

This presentation demonstrates native diagram support in DeckBot.

---

# Mermaid Flowchart Example

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

---

# Mermaid Sequence Diagram Example

```mermaid
sequenceDiagram
    participant User
    participant Agent
    participant System
    
    User->>Agent: Request diagram
    Agent->>System: Generate diagram
    System-->>Agent: Return diagram
    Agent-->>User: Display result
```

---

# Mermaid Gantt Chart Example

```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Design           :a1, 2024-01-01, 30d
    section Phase 2
    Development     :a2, after a1, 45d
    Testing         :a3, after a2, 15d
```

---

# Excalidraw Diagram Example

```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "type": "rectangle",
      "version": 1,
      "versionNonce": 1,
      "isDeleted": false,
      "id": "rect1",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "x": 100,
      "y": 100,
      "strokeColor": "#000000",
      "backgroundColor": "#15aabf",
      "width": 200,
      "height": 100,
      "seed": 1,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false
    },
    {
      "type": "text",
      "version": 1,
      "versionNonce": 2,
      "isDeleted": false,
      "id": "text1",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "x": 150,
      "y": 130,
      "strokeColor": "#000000",
      "backgroundColor": "transparent",
      "width": 100,
      "height": 25,
      "seed": 2,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "boundElements": [],
      "updated": 1,
      "link": null,
      "locked": false,
      "fontSize": 20,
      "fontFamily": 1,
      "text": "Hello!",
      "textAlign": "center",
      "verticalAlign": "middle",
      "baseline": 18,
      "containerId": null,
      "originalText": "Hello!",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  }
}
```

---

# Additional Diagram Types

DeckBot supports many diagram types via Kroki:

- **Mermaid**: Flowcharts, sequence diagrams, Gantt charts, class diagrams
- **Excalidraw**: Hand-drawn style diagrams
- **PlantUML**: UML diagrams
- **GraphViz**: Graph layouts
- **D2**: Declarative diagramming
- **And many more!**

---

# Usage

Simply use code blocks with the diagram type:

\`\`\`mermaid
graph TD
    A --> B
\`\`\`

The diagrams are rendered as first-class components in your slides!



