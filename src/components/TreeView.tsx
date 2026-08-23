import { useMemo, useEffect, useRef, useState } from "react"
import { TreeNode } from "../types"

type TreeViewProps = {
  treeData: TreeNode | null
}

type LayoutNode = Omit<TreeNode, "left" | "right" | "children"> & {
  x: number
  y: number
  leftW?: number
  rightW?: number
  left?: LayoutNode
  right?: LayoutNode
  children?: LayoutNode[]
}

const shiftLayoutNode = (n: LayoutNode, offset: number) => {
  n.x += offset
  if (n.left) shiftLayoutNode(n.left, offset)
  if (n.right) shiftLayoutNode(n.right, offset)
  if (n.children) n.children.forEach(c => shiftLayoutNode(c, offset))
}

function computeCompactLayout(node: LayoutNode | undefined): { width: number; center: number } {
  if (!node) return { width: 0, center: 0 }
  
  if (!node.left && !node.right && (!node.children || node.children.length === 0)) {
    node.x = 0
    return { width: 60, center: 30 }
  }

  const gap = 30 
  const shiftAmount = 30 

  if (node.children && node.children.length > 0) {
    const childrenLayouts = node.children.map(computeCompactLayout)
    let currentX = 0
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      const layout = childrenLayouts[i]
      shiftLayoutNode(child, currentX)
      currentX += layout.width + gap
    }
    const center = node.children.length === 1
      ? node.children[0].x
      : (node.children[0].x + node.children[node.children.length - 1].x) / 2
    node.x = center
    return { width: Math.max(60, currentX - gap), center }
  }

  const leftL = computeCompactLayout(node.left)
  const rightL = computeCompactLayout(node.right)

  let width = 0
  let center = 0

  if (node.left && node.right) {
    const rightOffset = leftL.width + gap
    
    shiftLayoutNode(node.right, rightOffset)

    center = (leftL.center + rightOffset + rightL.center) / 2
    node.x = center
    width = rightOffset + rightL.width
  } else if (node.left) {
    center = leftL.center + shiftAmount
    node.x = center
    width = Math.max(leftL.width, center + 30)
  } else if (node.right) {
    shiftLayoutNode(node.right, shiftAmount)
    center = 30
    node.x = center
    width = shiftAmount + rightL.width
  }

  return { width, center }
}

function assignDepths(node: LayoutNode | undefined, depth: number) {
  if (!node) return
  node.y = depth * 65 + 40
  if (node.left) assignDepths(node.left, depth + 1)
  if (node.right) assignDepths(node.right, depth + 1)
  if (node.children) node.children.forEach(c => assignDepths(c, depth + 1))
}

function getLayout(root: TreeNode | null): { layout: LayoutNode | null; width: number; height: number } {
  if (!root) return { layout: null, width: 0, height: 0 }
  
  const layoutRoot = JSON.parse(JSON.stringify(root)) as LayoutNode
  
  const { width } = computeCompactLayout(layoutRoot)
  assignDepths(layoutRoot, 0)
  
  let maxDepth = 0
  const traverse = (n: LayoutNode, d: number) => {
    if (d > maxDepth) maxDepth = d
    if (n.left) traverse(n.left, d + 1)
    if (n.right) traverse(n.right, d + 1)
    if (n.children) n.children.forEach(c => traverse(c, d + 1))
  }
  traverse(layoutRoot, 0)

  const shiftCoords = (n: LayoutNode) => {
    n.x += 40
    if (n.left) shiftCoords(n.left)
    if (n.right) shiftCoords(n.right)
    if (n.children) n.children.forEach(c => shiftCoords(c))
  }
  shiftCoords(layoutRoot)

  return { layout: layoutRoot, width: width + 80, height: maxDepth * 65 + 100 }
}

export default function TreeView({ treeData }: TreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { layout, width, height } = useMemo(() => getLayout(treeData), [treeData])

  // Componente recursivo para dibujar lineas y nodos
  const renderLines = (node: LayoutNode) => {
    return (
      <g key={`lines-${node.id}`}>
        {node.left && (
          <path
            d={`M ${node.x} ${node.y} C ${node.x} ${node.y + 40}, ${node.left.x} ${node.left.y - 40}, ${node.left.x} ${node.left.y}`}
            fill="none"
            stroke="#52241A"
            strokeWidth="2.5"
            strokeOpacity="0.25"
            className="transition-all duration-500"
          />
        )}
        {node.right && (
          <path
            d={`M ${node.x} ${node.y} C ${node.x} ${node.y + 40}, ${node.right.x} ${node.right.y - 40}, ${node.right.x} ${node.right.y}`}
            fill="none"
            stroke="#52241A"
            strokeWidth="2.5"
            strokeOpacity="0.25"
            className="transition-all duration-500"
          />
        )}
        {node.children && node.children.map(child => (
          <path
            key={`edge-${child.id}`}
            d={`M ${node.x} ${node.y} C ${node.x} ${node.y + 40}, ${child.x} ${child.y - 40}, ${child.x} ${child.y}`}
            fill="none"
            stroke="#52241A"
            strokeWidth="2.5"
            strokeOpacity="0.25"
            className="transition-all duration-500"
          />
        ))}
        {node.left && renderLines(node.left)}
        {node.right && renderLines(node.right)}
        {node.children && node.children.map(child => renderLines(child))}
      </g>
    )
  }

  const renderNodes = (node: LayoutNode) => {
    const isTraverse = node.activeState === "traverse"
    const isCollision = node.activeState === "collision"
    const isPlaced = node.activeState === "placed"

    let fill = "#faf6f2"
    let stroke = "#52241A"
    let strokeWidth = 2
    let textColor = "#52241A"
    let extraClasses = ""

    if (isTraverse) {
      fill = "#fff8eb"
      stroke = "#E6B793"
      strokeWidth = 3
      extraClasses = "shadow-lg scale-110 drop-shadow-[0_0_10px_rgba(230,183,147,0.7)]"
    } else if (isCollision) {
      fill = "#ffe5e5"
      stroke = "#d32f2f"
      strokeWidth = 3
      textColor = "#d32f2f"
      extraClasses = "shadow-lg scale-110 drop-shadow-[0_0_10px_rgba(211,47,47,0.7)]"
    } else if (isPlaced) {
      fill = "#e5ffe5"
      stroke = "#2f7d4f"
      strokeWidth = 3
      textColor = "#2f7d4f"
      extraClasses = "shadow-lg scale-110 drop-shadow-[0_0_10px_rgba(47,125,79,0.7)]"
    }

    return (
      <g key={`node-${node.id}`} className={`transition-all duration-500 ${extraClasses}`}>
        {/* Etiqueta de la rama (bits o char) si existe */}
        {(node.edgeLabel !== undefined || node.bitOrFreq !== undefined) && (
          <text
            x={node.x}
            y={node.y - 25}
            textAnchor="middle"
            fontSize="10"
            fill="#52241A"
            opacity="0.7"
            className="font-mono font-bold tracking-widest drop-shadow-sm"
          >
            {node.edgeLabel !== undefined ? node.edgeLabel : node.bitOrFreq}
          </text>
        )}
        
        <circle
          cx={node.x}
          cy={node.y}
          r="20"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          className="transition-colors duration-500 shadow-xl drop-shadow-md"
        />
        <text
          x={node.x}
          y={node.y + 4}
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill={textColor}
          className="transition-colors duration-500 select-none"
        >
          {node.label || ""}
        </text>

        {node.left && renderNodes(node.left)}
        {node.right && renderNodes(node.right)}
        {node.children && node.children.map(child => renderNodes(child))}
      </g>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[#52241A]/15 bg-[#faf6f2]/30 shadow-sm transition-all duration-300 w-full flex justify-center p-4 relative"
    >
      {layout ? (
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMin meet"
          className="transition-all duration-500"
        >
          {renderLines(layout)}
          {renderNodes(layout)}
        </svg>
      ) : (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center absolute inset-0">
          <p className="text-sm font-medium text-[#52241A]/50">
            El árbol está vacío.
          </p>
          <p className="text-[13px] text-[#52241A]/40">
            Inserta una clave o texto para visualizar el árbol.
          </p>
        </div>
      )}
    </div>
  )
}
