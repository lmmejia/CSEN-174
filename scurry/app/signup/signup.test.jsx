import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Signup from "./page";

//firebase mockup setup
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
}));
vi.mock("../../lib/firebase", () => ({
  auth: { mock: true },
}));

//helper functions to get the email box, password box, sign up button, and message
const emailBox = () => screen.getByPlaceholderText("Email");
const passwordBox = () => screen.getByPlaceholderText(/Password/);
const signUpButton = () => screen.getByRole("button", { name: "Sign Up" });
const message = () => screen.getByRole("status").textContent;

async function fillAndClick(email, password) {
  const user = userEvent.setup();
  if (email) await user.type(emailBox(), email);
  if (password) await user.type(passwordBox(), password);
  await user.click(signUpButton());
}

function forceSubmit(email, password) {
  fireEvent.change(emailBox(), { target: { value: email } });
  fireEvent.change(passwordBox(), { target: { value: password } });
  fireEvent.submit(emailBox().closest("form"));
}

describe("Signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    render(<Signup />);
  });

  afterEach(() => {
    cleanup();
  });

  //test to check if the email and password boxes are present
  it("does not submit with only an email", async () => {
    await fillAndClick("test@example.com", "");
    expect(passwordBox().checkValidity()).toBe(false);
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  //checks if email and password boxes are present (only if password made)
  it("does not submit with only a password", async () => {
    await fillAndClick("", "password123");
    expect(emailBox().checkValidity()).toBe(false);
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  //both fields are empty, should throw error and should not submit
  it("does not submit with both empty", async () => {
    await fillAndClick("", "");
    expect(emailBox().checkValidity()).toBe(false);
    expect(passwordBox().checkValidity()).toBe(false);
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  //does not accept an invalid email 
  it("does not submit with an invalid email", async () => {
    await fillAndClick("not-an-email", "password123");
    expect(emailBox().checkValidity()).toBe(false);
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  //test to show an error when Firebase says the email is invalid
  it("shows an error when Firebase says the email is invalid", async () => {
    createUserWithEmailAndPassword.mockRejectedValue({ code: "auth/invalid-email" });
    forceSubmit("bad@@email", "password123");
    await waitFor(() => expect(message()).toBe("Signup failed: auth/invalid-email"));
  });

  //password may be too weak for firebase 
  it("shows an error when Firebase says the password is weak", async () => {
    createUserWithEmailAndPassword.mockRejectedValue({ code: "auth/weak-password" });
    forceSubmit("test@example.com", "123");
    await waitFor(() => expect(message()).toBe("Signup failed: auth/weak-password"));
  });

  //account already exist and should not allow sign up to allow
  it("shows an error when the account already exists", async () => {
    createUserWithEmailAndPassword.mockRejectedValue({ code: "auth/email-already-in-use" });
    await fillAndClick("existing@example.com", "password123");
    await waitFor(() => expect(message()).toBe("Signup failed: auth/email-already-in-use"));
  });

  //test to check if account is made (should be successful)
  it("creates the account when inputs are valid and the account does not exist", async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: "abc123" } });
    await fillAndClick("new@example.com", "password123");
    await waitFor(() => expect(message()).toBe("Account created successfully!"));
  });
});