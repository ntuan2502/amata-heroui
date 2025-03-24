import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import HomeComponent from "@/components/home/home";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    redirect("/login");
  }

  return <HomeComponent />;
}
