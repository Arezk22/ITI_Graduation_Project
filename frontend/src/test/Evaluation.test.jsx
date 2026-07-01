import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Evaluation from "../pages/Evaluation";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../components/OwnerLayout", () => ({
  default: ({ children }) => <div data-testid="owner-layout">{children}</div>,
}));

const mockGetAllTenders = vi.fn();
const mockGetTenderEvaluation = vi.fn();
const mockGetTenderSubmissions = vi.fn();

vi.mock("../services/tenderApi", () => ({
  getAllTenders: (...args) => mockGetAllTenders(...args),
  getTenderEvaluation: (...args) => mockGetTenderEvaluation(...args),
}));

vi.mock("../services/proposalApi", () => ({
  getTenderSubmissions: (...args) => mockGetTenderSubmissions(...args),
}));

const mockTenders = [
  { id: 1, title: "Road Construction Project", project_category: "roads" },
  { id: 2, title: "Building Renovation", project_category: "buildings" },
];

const mockSubmissions = [
  {
    id: 10,
    contractor_company_name: "Alpha Build Co",
    bid_price: 500000,
    status: "under_review",
  },
  {
    id: 11,
    contractor_company_name: "Beta Construction",
    bid_price: 620000,
    status: "under_review",
  },
];

const mockAiSubmissions = [
  {
    id: 10,
    contractor_company_name: "Alpha Build Co",
    bid_price: 500000,
    technical_score: 85,
    experience_score: 90,
    compliance_score: 95,
    trust_score: 88,
    risk_score: 15,
    final_score: 88,
  },
  {
    id: 11,
    contractor_company_name: "Beta Construction",
    bid_price: 620000,
    technical_score: 72,
    experience_score: 80,
    compliance_score: 85,
    trust_score: 75,
    risk_score: 30,
    final_score: 76,
  },
];

describe("Evaluation - AI Pipeline Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllTenders.mockResolvedValue({ data: mockTenders });
    mockGetTenderSubmissions.mockResolvedValue({ data: mockSubmissions });
  });

  it("renders and calls getAllTenders on mount", async () => {
    mockGetTenderEvaluation.mockResolvedValue({ data: { status: "pending" } });

    render(
      <MemoryRouter>
        <Evaluation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetAllTenders).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.getByText("Road Construction Project")
    ).toBeInTheDocument();
  });

  it("calls getTenderEvaluation with the first tender id", async () => {
    mockGetTenderEvaluation.mockResolvedValue({ data: { status: "pending" } });

    render(
      <MemoryRouter>
        <Evaluation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetTenderEvaluation).toHaveBeenCalledWith("1");
    });
  });

  it("shows Pending badge when evaluation has not started", async () => {
    mockGetTenderEvaluation.mockResolvedValue({ data: { status: "pending" } });

    render(
      <MemoryRouter>
        <Evaluation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });
  });

  it("shows Ready + Completed and AI scores when evaluation is complete", async () => {
    mockGetTenderEvaluation.mockResolvedValue({
      data: {
        status: "completed",
        tender: { id: 1, title: "Road Construction Project" },
        submissions: mockAiSubmissions,
      },
    });

    render(
      <MemoryRouter>
        <Evaluation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Ready")).toBeInTheDocument();
    });
    expect(screen.getByText("Completed")).toBeInTheDocument();

    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText("76")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("shows Processing badge when analysis is running", async () => {
    mockGetTenderEvaluation.mockResolvedValue({
      data: { status: "processing" },
    });

    render(
      <MemoryRouter>
        <Evaluation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Processing")).toBeInTheDocument();
    });
  });

  it("shows Invalid badge when documents are invalid", async () => {
    mockGetTenderEvaluation.mockResolvedValue({
      data: {
        status: "Invalid Documents",
        message: "Documents could not be analyzed",
      },
    });

    render(
      <MemoryRouter>
        <Evaluation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Invalid")).toBeInTheDocument();
    });
  });

  it("shows submission count from AI data when completed", async () => {
    mockGetTenderEvaluation.mockResolvedValue({
      data: {
        status: "completed",
        tender: { id: 1, title: "Road Construction Project" },
        submissions: mockAiSubmissions,
      },
    });

    render(
      <MemoryRouter>
        <Evaluation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("2 submissions")).toBeInTheDocument();
    });
  });

  it("displays AI scores in the comparison table", async () => {
    mockGetTenderEvaluation.mockResolvedValue({
      data: {
        status: "completed",
        tender: { id: 1, title: "Road Construction Project" },
        submissions: mockAiSubmissions,
      },
    });

    render(
      <MemoryRouter>
        <Evaluation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("85")).toBeInTheDocument();
    });

    const cells = screen.getAllByText("85");
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it("shows evaluation data for the correct tender when selection changes", async () => {
    mockGetTenderEvaluation.mockResolvedValue({ data: { status: "pending" } });
    mockGetTenderSubmissions.mockResolvedValue({ data: [] });

    const { rerender } = render(
      <MemoryRouter>
        <Evaluation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetTenderEvaluation).toHaveBeenCalledWith("1");
    });

    mockGetTenderEvaluation.mockClear();
    mockGetTenderEvaluation.mockResolvedValue({
      data: {
        status: "completed",
        tender: { id: 2, title: "Building Renovation" },
        submissions: mockAiSubmissions,
      },
    });

    mockGetTenderSubmissions.mockResolvedValue({ data: mockSubmissions });

    rerender(
      <MemoryRouter>
        <Evaluation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Alpha Build Co")).toBeInTheDocument();
    });
  });
});
