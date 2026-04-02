"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, CheckCircle2 } from "lucide-react"

import { createClient } from "@/lib/supabase"
import {
  createIdeaSchema,
  type CreateIdeaFormValues,
} from "@/lib/validations/ideas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SubmittedIdea {
  id: string
  title: string
}

export function SubmitIdeaForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submittedIdea, setSubmittedIdea] = useState<SubmittedIdea | null>(null)

  const form = useForm<CreateIdeaFormValues>({
    resolver: zodResolver(createIdeaSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const titleLength = form.watch("title")?.length ?? 0
  const descriptionLength = form.watch("description")?.length ?? 0

  async function onSubmit(values: CreateIdeaFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = "/login"
        return
      }

      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setError(
            data.error ||
              "Du hast das Limit erreicht. Bitte versuche es später erneut."
          )
          return
        }
        if (response.status === 400 && data.details) {
          // Set field-level errors from server validation
          const fieldErrors = data.details as Record<string, string[]>
          for (const [field, messages] of Object.entries(fieldErrors)) {
            if (field === "title" || field === "description") {
              form.setError(field, { message: messages[0] })
            }
          }
          return
        }
        setError(
          data.error ||
            "Ein Fehler ist aufgetreten. Bitte versuche es erneut."
        )
        return
      }

      setSubmittedIdea({
        id: data.idea.id,
        title: data.idea.title,
      })
    } catch {
      setError(
        "Verbindungsfehler. Bitte prüfe deine Internetverbindung und versuche es erneut."
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Success state
  if (submittedIdea) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <CheckCircle2
            className="h-12 w-12 text-green-600"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              Idee erfolgreich eingereicht!
            </h2>
            <p className="text-sm text-muted-foreground">
              Deine Idee &ldquo;{submittedIdea.title}&rdquo; wurde gespeichert
              und wird geprüft.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/board">Zum Board</Link>
            </Button>
            <Button
              onClick={() => {
                setSubmittedIdea(null)
                form.reset()
              }}
            >
              Weitere Idee einreichen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Form state
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Idee einreichen</CardTitle>
        <CardDescription>
          Teile deine Idee mit dem Produktteam. Beschreibe sie so klar wie
          möglich.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Kurzer, aussagekräftiger Titel"
                      maxLength={100}
                      disabled={isLoading}
                      aria-describedby="title-counter"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <p
                      id="title-counter"
                      className={`ml-auto text-xs ${
                        titleLength > 90
                          ? "text-orange-600"
                          : "text-muted-foreground"
                      }`}
                      aria-live="polite"
                    >
                      {titleLength}/100
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beschreibe deine Idee ausführlich (min. 20 Zeichen)"
                      maxLength={500}
                      rows={5}
                      disabled={isLoading}
                      aria-describedby="description-counter"
                      className="resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <p
                      id="description-counter"
                      className={`ml-auto text-xs ${
                        descriptionLength > 450
                          ? "text-orange-600"
                          : descriptionLength < 20 && descriptionLength > 0
                            ? "text-orange-600"
                            : "text-muted-foreground"
                      }`}
                      aria-live="polite"
                    >
                      {descriptionLength}/500
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {error && (
              <div
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              Idee einreichen
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
