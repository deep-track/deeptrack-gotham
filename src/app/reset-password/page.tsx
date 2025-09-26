"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
    // Check if we're in build mode
    const isBuildMode = process.env.NODE_ENV === 'production' && 
      (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
       process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('your_clerk_publishable_key'));

    if (isBuildMode) {
        return (
            <div className="min-h-screen w-full max-w-5xl mx-auto flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
                    <p className="text-gray-600">This page is not available during build.</p>
                </div>
            </div>
        );
    }

    const { isLoaded, signIn, setActive } = useSignIn();
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"email" | "code" | "complete">("email");

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn) {
            router.replace("/");
        }

        // Pre-fill email if passed in URL params
        const emailParam = searchParams.get("email");
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [isLoaded, isSignedIn, router, searchParams]);

    // Step 1: Send reset password email
    async function handleSendResetEmail(e: React.FormEvent) {
        e.preventDefault();

        if (!email.trim()) {
            setErr("Please enter your email address.");
            return;
        }
        if (!isLoaded || !signIn) return;

        setErr(null);
        setSuccess(null);
        setLoading(true);

        try {
            await signIn.create({
                strategy: "reset_password_email_code",
                identifier: email,
            });
            setSuccess("Password reset code sent! Check your email.");
            setStep("code");
        } catch (e: unknown) {
            const error = e as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
            const message =
                error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || error.message || "Failed to send reset email";
            setErr(message);
        } finally {
            setLoading(false);
        }
    }

    // Step 2: Reset password with code
    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault();

        if (!resetCode.trim()) {
            setErr("Please enter the reset code from your email.");
            return;
        }
        if (!newPassword.trim()) {
            setErr("Please enter a new password.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setErr("Passwords do not match.");
            return;
        }
        if (newPassword.length < 8) {
            setErr("Password must be at least 8 characters long.");
            return;
        }
        if (!isLoaded || !signIn) return;

        setErr(null);
        setSuccess(null);
        setLoading(true);

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code: resetCode,
                password: newPassword,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                setStep("complete");
                setSuccess("Password reset successful! Redirecting...");
                setTimeout(() => router.push("/"), 2000);
            } else {
                setErr("Something went wrong. Please try again.");
            }
        } catch (e: unknown) {
            const error = e as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string };
            const message =
                error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || error.message || "Password reset failed";
            setErr(message);
        } finally {
            setLoading(false);
        }
    }

    if (!isLoaded) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen w-full max-w-5xl mx-auto flex items-center justify-center px-4">
            <div className="flex flex-col md:flex-row-reverse w-full max-w-5xl rounded-2xl overflow-hidden border border-border shadow-lg bg-card/70">

                {/* Left image */}
                <div className="w-full md:w-1/2 flex items-center justify-center p-6">
                    <Image src="/deeptrack-security.svg" alt="Reset Password Illustration" width={400} height={400} />
                </div>

                {/* Right form area */}
                <div className="w-full md:w-1/2 px-6 py-10 space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] bg-clip-text text-transparent">
                            Reset Password
                        </h2>
                        <p className="text-sm text-foreground/70 mt-2">
                            {step === "email" && "Enter your email to receive a reset code"}
                            {step === "code" && "Enter the code from your email and set a new password"}
                            {step === "complete" && "Password reset complete!"}
                        </p>
                    </div>

                    {err && (
                        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
                            {err}
                        </div>
                    )}

                    {success && (
                        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                            {success}
                        </div>
                    )}

                    {step === "email" && (
                        <form onSubmit={handleSendResetEmail} className="space-y-5">
                            <div>
                                <label className="block text-sm mb-1 text-foreground/80">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email address"
                                    className="w-full px-4 py-2 bg-input text-foreground border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[hsl(var(--primary))]/60 to-[#7F5AF0]/70 text-stone-100 font-medium py-2 rounded-md shadow-sm hover:opacity-90 transition disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Reset Code"}
                            </button>
                        </form>
                    )}

                    {step === "code" && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <label className="block text-sm mb-1 text-foreground/80">Reset Code</label>
                                <input
                                    type="text"
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    required
                                    placeholder="Enter the code from your email"
                                    className="w-full px-4 py-2 bg-input text-foreground border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-foreground/80">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Enter new password (min 8 characters)"
                                    className="w-full px-4 py-2 bg-input text-foreground border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-foreground/80">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirm your new password"
                                    className="w-full px-4 py-2 bg-input text-foreground border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[hsl(var(--primary))]/60 to-[#7F5AF0]/70 text-stone-100 font-medium py-2 rounded-md shadow-sm hover:opacity-90 transition disabled:opacity-50"
                            >
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep("email");
                                    setResetCode("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                    setErr(null);
                                    setSuccess(null);
                                }}
                                className="w-full text-sm text-blue-500 hover:text-blue-600 underline"
                            >
                                Back to Email Step
                            </button>
                        </form>
                    )}

                    {step === "complete" && (
                        <div className="text-center space-y-4">
                            <div className="text-green-600 text-6xl">✓</div>
                            <p className="text-lg font-medium">Password Reset Successful!</p>
                            <p className="text-sm text-foreground/70">You will be redirected to the homepage shortly.</p>
                        </div>
                    )}

                    <div className="mt-6 text-center text-sm border-t border-border pt-4">
                        Remember your password?{" "}
                        <Link href="/login" className="text-blue-500 hover:underline">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}