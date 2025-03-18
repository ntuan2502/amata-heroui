import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookiesData = await cookies();
  const token = cookiesData.get("token")?.value;
  const userCookie = cookiesData.get("user")?.value;

  if (!token || !userCookie) {
    redirect("/login");
  }

  const user = JSON.parse(userCookie);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Xin chào, <strong>{user.username}</strong>!</p>
      <p>Email: {user.email}</p>
    </div>
  );
}
