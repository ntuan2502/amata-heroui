"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import Image from "next/image";
import { ThemeSwitch } from "./theme-switch";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NavbarComponent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Kiểm tra token mỗi khi component render lại
  useEffect(() => {
    setIsAuthenticated(!!Cookies.get("token"));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    setIsAuthenticated(false);
  };

  return (
    <Navbar isBordered isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
      <NavbarBrand>
        <Image
          alt="logo"
          className="hidden sm:flex"
          height={75}
          src="/amata.png"
          width={100}
        />
      </NavbarBrand>
      <NavbarContent className="sm:hidden pr-3" justify="center">
        <h1 className="text-2xl">IT Asset Management</h1>
      </NavbarContent>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <h1 className="text-3xl">IT Asset Management</h1>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
        {isAuthenticated && (
          <NavbarItem>
            <Button
              as={Link}
              color="danger"
              href="#"
              onPress={handleLogout}
              variant="flat"
            >
              Logout
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>
    </Navbar>
  );
}
