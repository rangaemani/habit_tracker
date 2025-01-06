<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { supabase } from "./supabase";
    import { user } from "./stores";
    import { fade, fly } from "svelte/transition";
    let email = "";
    let password = "";
    let loading = false;
    let error = "";
    let message = "";
    let isResetMode = false;
    let hCaptchaToken = null;

    onMount(() => {
        const hcaptchaSitekey = "ccacfebe-68dc-4bc0-8ea8-e43afdb8555c";
        // Load the hCaptcha script if it's not already present
        if (!window.hcaptcha) {
            const script = document.createElement("script");
            script.src = `https://js.hcaptcha.com/1/api.js?render=explicit`;
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);

            script.onload = () => {
                window.hcaptcha.render("h-captcha-container", {
                    sitekey: hcaptchaSitekey,
                    callback: (token) => {
                        hCaptchaToken = token;
                    },
                    "error-callback": () => {
                        hCaptchaToken = null;
                        error = "Please complete the hCaptcha challenge.";
                    },
                });
            };
        }
    });

    // onDestroy(() => {
    //     if (widgetId !== null && window.hcaptcha) {
    //         window.hcaptcha.reset(widgetId); // Reset using the widget ID
    //         widgetId = null; // Clear the widget ID
    //     }
    // });

    async function handleAuth(type: "signup" | "login" | "guest") {
        loading = true;
        error = "";
        message = "";

        if (type === "signup" || type === "login") {
            if (!hCaptchaToken && type !== "guest") {
                error = "Please complete the hCaptcha challenge.";
                loading = false;
                return;
            }

            const authOptions = {
                captchaToken: hCaptchaToken,
            };

            let data, authError;
            try {
                if (type === "signup") {
                    ({ data, error: authError } = await supabase.auth.signUp({
                        email,
                        password,
                        options: authOptions,
                    }));
                } else {
                    ({ data, error: authError } =
                        await supabase.auth.signInWithPassword({
                            email,
                            password,
                            options: authOptions,
                        }));
                }
            } catch (err) {
                console.error("Authentication error:", err); // Log the full error for debugging
                error = err.message || "An unexpected error occurred."; // Display a user-friendly message
                loading = false;
                return; // Stop execution if there's an error
            }

            if (authError) {
                console.error("Supabase Auth error:", authError); // Log the Supabase error
                error = authError.message;
            } else {
                user.set(data.user); // Or data.session for anonymous login
                message =
                    type === "signup"
                        ? "Account created successfully!"
                        : "Logged in successfully!";

                hCaptchaToken = null;
                if (window.hcaptcha) {
                    // Check if hcaptcha is loaded
                    window.hcaptcha.reset();
                }
            }
        } else if (type === "guest") {
            try {
                const { data, error: authError } =
                    await supabase.auth.signInAnonymously();
                if (authError) {
                    error = authError.message;
                } else {
                    user.set(data.session); // Use data.session for anonymous login
                    // Redirect or update UI as needed
                }
            } catch (err) {
                console.error("Guest login error:", err);
                error =
                    err.message ||
                    "An unexpected error occurred during guest login.";
            }
        }

        loading = false;
    }
    async function handleResetPassword() {
        if (!email) {
            error = "Please enter your email address";
            return;
        }

        loading = true;
        error = "";
        message = "";

        try {
            const { data, error: resetError } =
                await supabase.auth.resetPasswordForEmail(email);

            if (resetError) {
                console.error("Reset password error:", resetError);
                error =
                    resetError.message ||
                    "An error occurred while resetting password";
            } else {
                message = "Password reset instructions sent to your email";
                isResetMode = false;
            }
        } catch (error) {
            console.error("Password reset error:", error);
            error = "An unexpected error occurred while resetting password";
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-[80vh] flex items-center justify-center">
    <div
        in:fly={{ y: 20, duration: 500 }}
        class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg"
    >
        <div>
            <div class="flex justify-center">
                <svg
                    class="w-16 h-16 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                </svg>
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                {#if loading}
                    <div class="flex justify-center">
                        <div
                            class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"
                        ></div>
                    </div>
                {:else}
                    {isResetMode
                        ? "Reset Password"
                        : "Welcome to Habit Tracker"}
                {/if}
            </h2>
        </div>
        <form class="mt-8 space-y-6" on:submit|preventDefault>
            <div
                class="rounded-md shadow-sm {isResetMode ? '' : '-space-y-px'}"
            >
                <div class="mb-2">
                    <input
                        bind:value={email}
                        on:keydown={(e) => {
                            if (e.key === "Enter") handleAuth("login");
                        }}
                        type="email"
                        required
                        class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                        placeholder="Email address"
                    />
                </div>
                {#if !isResetMode}
                    <div>
                        <input
                            bind:value={password}
                            on:keydown={(e) => {
                                if (e.key === "Enter") handleAuth("login");
                            }}
                            type="password"
                            required
                            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                            placeholder="Password"
                        />
                    </div>
                {/if}
            </div>

            <div id="h-captcha-container"></div>

            {#if error}
                <div
                    in:fade={{ duration: 200 }}
                    class="text-red-500 text-sm bg-red-50 p-3 rounded-md"
                >
                    {error}
                </div>
            {/if}

            {#if message}
                <div
                    in:fade={{ duration: 200 }}
                    class="text-green-500 text-sm bg-green-50 p-3 rounded-md"
                >
                    {message}
                </div>
            {/if}

            {#if isResetMode}
                <div class="flex flex-col space-y-4">
                    <button
                        type="button"
                        on:click={handleResetPassword}
                        class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                        Send Reset Instructions
                    </button>
                    <button
                        type="button"
                        on:click={() => {
                            isResetMode = false;
                            error = "";
                            message = "";
                        }}
                        class="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                        Back to Sign In
                    </button>
                </div>
            {:else}
                <div class="flex flex-col space-y-4">
                    <div class="flex space-x-4">
                        <button
                            type="button"
                            on:click={() => handleAuth("login")}
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            on:click={() => handleAuth("signup")}
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                        >
                            Sign up
                        </button>
                    </div>
                    {#if !isResetMode}
                        <button
                            on:click={() => handleAuth("guest")}
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                        >
                            Continue as Guest
                        </button>{/if}
                    <button
                        type="button"
                        on:click={() => {
                            isResetMode = true;
                            error = "";
                            message = "";
                        }}
                        class="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                        Forgot your password?
                    </button>
                </div>
            {/if}
        </form>
    </div>
</div>
