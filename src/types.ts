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
