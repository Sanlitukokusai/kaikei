import { prevMonth, prevMonthEnd, nextMonth, nextMonthEnd } from "@/app/(app)/reports/ReportsClient";

describe("date navigation helpers", () => {
  describe("prevMonth", () => {
    test("steps back one month", () => {
      expect(prevMonth("2024-03-01")).toBe("2024-02-01");
    });
    test("handles January → December of previous year", () => {
      expect(prevMonth("2024-01-01")).toBe("2023-12-01");
    });
  });

  describe("prevMonthEnd", () => {
    test("returns last day of previous month", () => {
      expect(prevMonthEnd("2024-03-31")).toBe("2024-02-29"); // 2024 is leap year
    });
    test("non-leap year February", () => {
      expect(prevMonthEnd("2023-03-31")).toBe("2023-02-28");
    });
  });

  describe("nextMonth", () => {
    test("steps forward one month", () => {
      expect(nextMonth("2024-01-01")).toBe("2024-02-01");
    });
    test("handles December → January of next year", () => {
      expect(nextMonth("2023-12-01")).toBe("2024-01-01");
    });
  });

  describe("nextMonthEnd", () => {
    test("returns last day of next month", () => {
      expect(nextMonthEnd("2024-01-31")).toBe("2024-02-29"); // leap year
    });
    test("March → April has 30 days", () => {
      expect(nextMonthEnd("2024-03-31")).toBe("2024-04-30");
    });
  });
});
