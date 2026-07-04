import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Cta } from "@/widgets/cta";
import {
  onWidgetronEvent,
  type WidgetronEventDetail,
} from "@/lib/analytics";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Cta email-form", () => {
  it("keeps submit disabled until the email is valid and consent is ticked", async () => {
    render(
      <Cta
        variant="email-form"
        title="Join the list"
        privacyUrl="https://example.com/privacy"
        submitEndpoint="https://example.com/subscribe"
      />,
    );

    const submit = screen.getByRole("button", { name: "Sign up" });
    expect(submit).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText("Your email"),
      "reader@example.com",
    );
    // Valid email but consent still unchecked → still disabled.
    expect(submit).toBeDisabled();

    await userEvent.click(screen.getByRole("checkbox"));
    expect(submit).toBeEnabled();
  });

  it("POSTs the email as JSON and shows the success message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    render(
      <Cta
        variant="email-form"
        title="Join the list"
        submitEndpoint="https://example.com/subscribe"
      />,
    );

    await userEvent.type(
      screen.getByLabelText("Your email"),
      "reader@example.com",
    );
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() =>
      expect(
        screen.getByText("Done — check your inbox."),
      ).toBeInTheDocument(),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/subscribe",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "reader@example.com" }),
      }),
    );
  });

  it("emits submitted {ok} without leaking the email, for success and failure", async () => {
    const received: WidgetronEventDetail[] = [];
    const off = onWidgetronEvent((e) => received.push(e.detail));

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true } as Response),
    );
    const first = render(
      <Cta
        variant="email-form"
        title="Join"
        submitEndpoint="https://example.com/subscribe"
      />,
    );
    await userEvent.type(
      screen.getByLabelText("Your email"),
      "reader@example.com",
    );
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0]).toMatchObject({
      widget: "cta",
      action: "submitted",
      data: { ok: true },
    });
    expect(JSON.stringify(received[0])).not.toContain("reader@example.com");
    first.unmount();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response),
    );
    render(
      <Cta
        variant="email-form"
        title="Join"
        submitEndpoint="https://example.com/subscribe"
      />,
    );
    await userEvent.type(
      screen.getByLabelText("Your email"),
      "reader@example.com",
    );
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    await waitFor(() => expect(received).toHaveLength(2));
    expect(received[1].data).toEqual({ ok: false });
    off();
  });
});

describe("Cta link", () => {
  it("emits clicked with the destination url", async () => {
    const received: WidgetronEventDetail[] = [];
    const off = onWidgetronEvent((e) => received.push(e.detail));
    // jsdom cannot navigate — swallow the anchor's default action.
    const stopNav = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("click", stopNav);

    render(
      <Cta
        variant="link"
        title="Go deeper"
        buttonLabel="Open the guide"
        url="https://example.com/guide"
      />,
    );
    await userEvent.click(screen.getByRole("link", { name: /Open the guide/ }));

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      widget: "cta",
      action: "clicked",
      data: { variant: "link", url: "https://example.com/guide" },
    });

    document.removeEventListener("click", stopNav);
    off();
  });
});
