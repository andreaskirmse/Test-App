"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { createClient } from "@/lib/supabase"
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      })

      if (authError) {
        if (authError.message.toLowerCase().includes("already registered")) {
          setError("Diese E-Mail-Adresse wird bereits verwendet")
        } else {
          setError("Registrierung fehlgeschlagen. Bitte versuche es erneut.")
        }
        return
      }

      setRegisteredEmail(values.email)
      setSuccess(true)
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    if (!registeredEmail) return
    setResendLoading(true)
    setResendMessage(null)
    try {
      const supabase = createClient()
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: registeredEmail,
      })
      if (resendError) {
        setResendMessage("E-Mail konnte nicht erneut gesendet werden. Bitte versuche es später.")
      } else {
        setResendMessage("E-Mail wurde erneut gesendet.")
      }
    } catch {
      setResendMessage("Ein Fehler ist aufgetreten. Bitte versuche es später.")
    } finally {
      setResendLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-primary/10 p-4">
          <h3 className="text-lg font-medium">Bestätigungs-E-Mail gesendet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Wir haben dir eine E-Mail gesendet. Bitte klicke auf den Link in der
            E-Mail, um dein Konto zu bestätigen.
          </p>
        </div>
        {resendMessage && (
          <p className="text-sm text-muted-foreground">{resendMessage}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Keine E-Mail erhalten?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Wird gesendet…" : "Erneut senden"}
          </button>
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="deine@email.de"
                  autoComplete="email"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passwort</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Mindestens 8 Zeichen"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
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
          Registrieren
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Bereits ein Konto?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Einloggen
          </Link>
        </p>
      </form>
    </Form>
  )
}
