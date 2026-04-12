import { screen } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import { BrowseJobs } from "../pages/job-seeker";
import { describe, test, expect } from "vitest";

describe("Browse Jobs Page Test", () => {
  test("renders search input", () => {
    renderWithProviders(<BrowseJobs />);
    const input = screen.getByPlaceholderText(/find job title/i);
    expect(input).toBeInTheDocument();
  });

  test("renders title text", () => {
    renderWithProviders(<BrowseJobs />);
    const text = screen.getByText(/let's find your dream job/i);
    expect(text).toBeInTheDocument();
  });
});