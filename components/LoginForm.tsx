"use client";

import { useState } from "react";
import { login } from "@/lib/api";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.jwt);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Đăng nhập thất bại!");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Đăng nhập</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          required
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
