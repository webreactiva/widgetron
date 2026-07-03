import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Cta } from "@/widgets/cta";

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
});
