"use client";

import React, { useState } from "react";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import Image from "next/image";
import { ThemeSwitch } from "./theme-switch";
import { useAuth } from "@/context/AuthContext";

export default function NavbarComponent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  // Lấy chữ cái đầu tiên của username (viết hoa)
  const avatarInitial = user?.username
    ? user.username.charAt(0).toUpperCase()
    : "?";

  return (
    <Navbar isBordered isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
      <NavbarBrand>
        <Image
          alt="logo"
          className="hidden sm:flex w-[100px] h-auto"
          src="/amata.png"
          height={500}
          width={500}
          priority
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
        {isAuthenticated && user && (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="secondary"
                name={avatarInitial}
                size="sm"
              >
                {avatarInitial}
              </Avatar>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" textValue="profile" className="h-14 gap-2">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold">{user.email}</p>
              </DropdownItem>
              <DropdownItem key="documentId" textValue="documentId">{user.documentId}</DropdownItem>
              <DropdownItem key="logout" color="danger" onPress={logout}>
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </NavbarContent>
    </Navbar>
  );
}
