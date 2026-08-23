export type SectionId = "internas" | "externas" | "grafos"

export type Section = {
  id: SectionId
  label: string
  icon: string
  options: string[]
}

export type Row = {
  pos: number
  key: string
  inactive?: boolean
  collidingKey?: string
}

export interface TreeNode {
  id: string
  label?: string
  bitOrFreq?: number | string
  isLeaf?: boolean
  left?: TreeNode
  right?: TreeNode
  children?: TreeNode[]
  edgeLabel?: string
  activeState?: "traverse" | "collision" | "placed" | "match" | null
}

export type PendingChange =
  | { type: "section"; option: string; sectionId?: SectionId }
  | { type: "hashAlgo"; algo: string }
  | { type: "collision"; coll: string; double?: string }
