import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { cookies } from "next/headers";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (token) {
    redirect("/");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <LoginForm />
    </div>
  );
}
