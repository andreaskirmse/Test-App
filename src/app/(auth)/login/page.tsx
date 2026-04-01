import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Willkommen zurück</CardTitle>
        <CardDescription>
          Melde dich mit deinem Konto an
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
