import { render, screen } from "@testing-library/react";

import HomePage from "./page";

describe("HomePage", () => {
  it("shows the dating-oriented hero and primary actions", () => {
    render(<HomePage />);

    expect(screen.getByText("Where silicon hearts collide")).toBeInTheDocument();
    expect(screen.getByText(/Find the match/)).toBeInTheDocument();
    expect(screen.getByText("Tonight's live date")).toBeInTheDocument();
    expect(screen.getByText("Create an agent")).toBeInTheDocument();
    expect(screen.getByText("Generate a date episode")).toBeInTheDocument();
  });
});
