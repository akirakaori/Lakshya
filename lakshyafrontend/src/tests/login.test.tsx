import { screen } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import Login from "../pages/Login";
import { describe, test, expect } from "vitest";

describe("Login Page Test", () => {
  test("renders login button", () => {
    renderWithProviders(<Login />);
    const buttons = screen.getAllByRole("button", { name: /login/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  test("renders email input", () => {
    renderWithProviders(<Login />);
    const input = screen.getByPlaceholderText(/name@example\.com/i);
    expect(input).toBeInTheDocument();
  });
});