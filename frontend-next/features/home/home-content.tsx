import { Inbox, Plus, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type HomeContentProps = {
  title: string
  description: string
}

const blocks = [
  {
    title: "Notes",
    description: "Start with a quick draft, outline, or working document.",
  },
  {
    title: "Files",
    description: "Collect PDFs, references, and shared assets in one place.",
  },
  {
    title: "Data",
    description: "Keep your transaction views organized and easy to revisit.",
  },
]

export function HomeContent({ title, description }: HomeContentProps) {
  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="space-y-4">
          <Badge variant="outline" className="rounded-md">
            Simple layout
          </Badge>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">
              <Plus className="size-4" />
              New page
            </Button>
            <Button variant="outline" size="sm">
              <Inbox className="size-4" />
              Browse files
            </Button>
          </div>
        </section>

        <Separator />

        <section className="grid gap-4 md:grid-cols-3">
          {blocks.map((block) => (
            <Card key={block.title} className="bg-white">
              <CardHeader>
                <CardTitle>{block.title}</CardTitle>
                <CardDescription>{block.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" />
              <CardTitle>Start here</CardTitle>
            </div>
            <CardDescription>
              This is a clean starting point with a Notion-like sidebar and
              simple content area.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Use the sidebar for navigation, then expand the content area with
              pages, tables, upload flows, or dashboard blocks as needed.
            </p>
            <p>
              The layout keeps the default feel of the installed shadcn
              components, so you can keep building without redesigning the base
              primitives first.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
