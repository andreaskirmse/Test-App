import { SubmitIdeaForm } from "@/components/ideas/submit-idea-form"

export const metadata = {
  title: "Idee einreichen",
  description: "Reiche eine neue Idee ein",
}

export default function SubmitPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <SubmitIdeaForm />
      </div>
    </main>
  )
}
