import { render, screen } from "@testing-library/react";

import HomePage from "./page";

describe("HomePage", () => {
  it("shows the core call to action", () => {
    render(<HomePage />);

    expect(screen.getByText("Create an agent")).toBeInTheDocument();
    expect(screen.getByText("Generate a date episode")).toBeInTheDocument();
  });
});
