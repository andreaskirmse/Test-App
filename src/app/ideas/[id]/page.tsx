import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VoteButton } from "@/components/ideas/vote-button"
import { CommentList } from "@/components/comments/comment-list"
import { createServerSupabaseClient } from "@/lib/supabase-server"

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function IdeaDetailPage({ params }: PageProps) {
  const { id } = await params

  // Validate UUID format before hitting the database
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }

  const supabase = await createServerSupabaseClient()

  // Fetch idea, author profile, vote count, and current user in parallel
  const [
    { data: idea, error: ideaError },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("ideas").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ])

  if (ideaError || !idea) {
    notFound()
  }

  // Fetch author name and vote data — depends on idea.user_id
  const [
    { data: profile },
    { count: voteCount },
    userVoteResult,
  ] = await Promise.all([
    supabase.from("profiles").select("email").eq("id", idea.user_id).single(),
    supabase.from("votes").select("id", { count: "exact", head: true }).eq("idea_id", id),
    user
      ? supabase.from("votes").select("id").eq("idea_id", id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const authorName = profile?.email ? profile.email.split("@")[0] : "Anonym"
  const initialVoteCount = voteCount ?? 0
  const initialHasVoted = !!userVoteResult?.data

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Back link */}
        <Link
          href="/board"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Board
        </Link>

        {/* Idea Detail Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-xl leading-snug">
                {idea.title}
              </CardTitle>
              <VoteButton
                ideaId={idea.id}
                initialVoteCount={initialVoteCount}
                initialHasVoted={initialHasVoted}
              />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {idea.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{authorName}</span>
              <span aria-hidden="true">-</span>
              <time dateTime={idea.created_at}>
                {formatDate(idea.created_at)}
              </time>
              {idea.status === "pending" && (
                <Badge variant="outline" className="text-xs">
                  Ausstehend
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <CommentList ideaId={idea.id} />
      </div>
    </main>
  )
}
