"use client";

import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const login = async (email: string, password: string) => {
  try {
    const response = await api.post("/api/auth/local", {
      identifier: email,
      password,
    });

    const { jwt, user } = response.data;

    // Lưu cả token và thông tin user vào cookie
    Cookies.set("token", jwt, { expires: 7 });
    Cookies.set("user", JSON.stringify(user), { expires: 7 });

    return response.data;
  } catch (error) {
    throw error;
  }
};
