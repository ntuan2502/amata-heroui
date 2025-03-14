"use client";
import React from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import Image from "next/image";
import { ThemeSwitch } from "./theme-switch";

export default function NavbarComponent() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <Navbar isBordered isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen}>
      <NavbarBrand>
        <Image alt="logo" className="hidden sm:flex" height={75} src="/amata.png" width={100} />
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
      </NavbarContent>
    </Navbar>
  );
}
