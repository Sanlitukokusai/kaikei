/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { Button, Chip } from "@/components/ui";

// lucide-react uses ESM; mock it so Jest can import it
jest.mock("lucide-react", () => {
  const React = require("react");
  const proxy = new Proxy(
    {},
    {
      get: (_t, name) => {
        const IconMock = ({ "data-testid": tid, ...p }: Record<string, unknown>) =>
          React.createElement("svg", { "data-testid": tid ?? `icon-${String(name)}`, ...p });
        IconMock.displayName = String(name);
        return IconMock;
      },
    },
  );
  return proxy;
});

describe("Button", () => {
  test("renders children", () => {
    render(<Button>保存</Button>);
    expect(screen.getByText("保存")).toBeInTheDocument();
  });

  test("applies primary variant class", () => {
    render(<Button variant="primary">登録</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn", "primary");
  });

  test("applies danger variant class", () => {
    render(<Button variant="danger">削除</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn", "danger");
  });

  test("forwards disabled prop", () => {
    render(<Button disabled>送信</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("renders with sm size class", () => {
    render(<Button size="sm">編集</Button>);
    expect(screen.getByRole("button")).toHaveClass("sm");
  });
});

describe("Chip", () => {
  test("renders children", () => {
    render(<Chip tone="s">確認済</Chip>);
    expect(screen.getByText("確認済")).toBeInTheDocument();
  });

  test("applies tone class", () => {
    const { container } = render(<Chip tone="w">未払</Chip>);
    expect(container.firstChild).toHaveClass("chip", "w");
  });

  test("dot is rendered by default", () => {
    const { container } = render(<Chip>テスト</Chip>);
    expect(container.querySelector(".dot")).toBeInTheDocument();
  });

  test("dot hidden when dot=false", () => {
    const { container } = render(<Chip dot={false}>テスト</Chip>);
    expect(container.querySelector(".dot")).not.toBeInTheDocument();
  });
});
