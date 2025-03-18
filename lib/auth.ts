import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

interface UserPayload {
  id: number;
  email: string;
  username: string;
}

export const getUserFromToken = async (): Promise<UserPayload | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded: any = jwtDecode(token);
    return {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
    };
  } catch (error) {
    return null;
  }
};
