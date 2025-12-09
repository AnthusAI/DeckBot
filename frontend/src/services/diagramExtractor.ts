/**
 * Utility functions for extracting Excalidraw diagrams from markdown content
 */

export interface DiagramBlock {
  json: string
  startIndex: number
  endIndex: number
  startLine: number
  endLine: number
}

export interface MermaidBlock {
  code: string
  startIndex: number
  endIndex: number
  startLine: number
  endLine: number
}

/**
 * Extract all diagram code blocks (any type) from markdown to get total count
 * This helps match rendered diagrams to their source blocks
 */
export function extractAllDiagramBlocks(content: string): { type: string; index: number }[] {
  const blocks: { type: string; index: number }[] = []
  // Match any diagram type: mermaid, excalidraw, plantuml, etc.
  const regex = /```(\w+)\n[\s\S]*?\n```/g
  let match
  let index = 0
  
  while ((match = regex.exec(content)) !== null) {
    blocks.push({ type: match[1], index })
    index++
  }
  
  return blocks
}

/**
 * Extract all Excalidraw code blocks from markdown content
 */
export function extractExcalidrawBlocks(content: string): DiagramBlock[] {
  const blocks: DiagramBlock[] = []
  const regex = /```excalidraw\n([\s\S]*?)\n```/g
  
  let match
  
  // Calculate line numbers for each position
  const lineStarts: number[] = [0]
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') {
      lineStarts.push(i + 1)
    }
  }
  
  const getLineNumber = (index: number): number => {
    for (let i = lineStarts.length - 1; i >= 0; i--) {
      if (lineStarts[i] <= index) {
        return i + 1
      }
    }
    return 1
  }
  
  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0]
    const jsonContent = match[1]
    const startIndex = match.index
    const endIndex = match.index + fullMatch.length
    const startLine = getLineNumber(startIndex)
    const endLine = getLineNumber(endIndex)
    
    blocks.push({
      json: jsonContent.trim(),
      startIndex,
      endIndex,
      startLine,
      endLine
    })
  }
  
  return blocks
}

/**
 * Detect if cursor is in an Excalidraw block and return all blocks
 * Alias for extractExcalidrawBlocks for consistency
 */
export function detectExcalidrawBlock(content: string): DiagramBlock[] {
  return extractExcalidrawBlocks(content)
}

/**
 * Get a specific Excalidraw block by index (0-based)
 */
export function getExcalidrawBlock(content: string, index: number): DiagramBlock | null {
  const blocks = extractExcalidrawBlocks(content)
  return blocks[index] || null
}

/**
 * Replace a specific Excalidraw block with new JSON content
 */
export function replaceExcalidrawBlock(
  content: string,
  index: number,
  newJson: string
): string | null {
  const blocks = extractExcalidrawBlocks(content)
  const block = blocks[index]
  
  if (!block) {
    return null
  }
  
  // Format the new JSON with proper indentation
  const formattedJson = newJson.split('\n').map(line => line).join('\n')
  const newBlock = `\`\`\`excalidraw\n${formattedJson}\n\`\`\``
  
  // Replace the block in the content
  const before = content.substring(0, block.startIndex)
  const after = content.substring(block.endIndex)
  
  return before + newBlock + after
}

/**
 * Extract all Mermaid code blocks from markdown content
 */
export function extractMermaidBlocks(content: string): MermaidBlock[] {
  const blocks: MermaidBlock[] = []
  const regex = /```mermaid\n([\s\S]*?)\n```/g
  
  let match
  
  // Calculate line numbers for each position
  const lineStarts: number[] = [0]
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') {
      lineStarts.push(i + 1)
    }
  }
  
  const getLineNumber = (index: number): number => {
    for (let i = lineStarts.length - 1; i >= 0; i--) {
      if (lineStarts[i] <= index) {
        return i + 1
      }
    }
    return 1
  }
  
  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0]
    const codeContent = match[1]
    const startIndex = match.index
    const endIndex = match.index + fullMatch.length
    const startLine = getLineNumber(startIndex)
    const endLine = getLineNumber(endIndex)
    
    blocks.push({
      code: codeContent.trim(),
      startIndex,
      endIndex,
      startLine,
      endLine
    })
  }
  
  return blocks
}

/**
 * Get a specific Mermaid block by index (0-based)
 */
export function getMermaidBlock(content: string, index: number): MermaidBlock | null {
  const blocks = extractMermaidBlocks(content)
  return blocks[index] || null
}

/**
 * Replace a specific Mermaid block with new code
 */
export function replaceMermaidBlock(
  content: string,
  index: number,
  newCode: string
): string | null {
  const blocks = extractMermaidBlocks(content)
  const block = blocks[index]
  
  if (!block) {
    return null
  }
  
  const newBlock = `\`\`\`mermaid\n${newCode}\n\`\`\``
  
  // Replace the block in the content
  const before = content.substring(0, block.startIndex)
  const after = content.substring(block.endIndex)
  
  return before + newBlock + after
}


