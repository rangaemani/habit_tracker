<script lang="ts">
  import {onMount} from 'svelte';
  import {supabase} from './lib/supabase';
  import {authStore, user} from './lib/stores';
  import Auth from './lib/Auth.svelte';
  import HabitList from './lib/HabitList.svelte';
  import Analytics from './lib/Analytics.svelte';
  import {fade, fly} from 'svelte/transition';

  let email: string = "";
    let password: string = "";

    onMount(() => {
        supabase.auth.getSession().then(({data: {session}}) => {
            user.set(session?.user ?? null);
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            user.set(session?.user ?? null);
        });
    });

    async function handleSignOut() {
        await supabase.auth.signOut();
        user.set(null);
    }

    async function createUser(email: string, password: string) {
        try {
            const {data, error} = await supabase.auth.updateUser({email: 'valid.email@supabase.io'});
            if (error) {
                console.error(error);
            }
        } catch (error) {
            console.error(error);
        }
        try {
            const {data, error} = await supabase.auth.updateUser({password: 'password'});
            if (error) {
                console.error(error);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const AuthID = $authStore;
</script>

<div
        class="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-blue-100"
>
    <header
            class="bg-white shadow-lg"
            in:fly={{ y: -20, duration: 500 }}
    >
        <nav class="container mx-auto px-4 py-6">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <svg
                            class="w-8 h-8 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                    >
                        <path
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                        />
                    </svg>
                    <a href="/"
                    ><h1 class="text-2xl font-bold text-gray-800">Habit Tracker</h1></a
                    >
                </div>
                {#if AuthID?.user?.is_anonymous}
                    <input
                            bind:value={email}
                            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                            on:keydown={(e) => {
                        }}
                            placeholder="Email address"
                            required
                            type="email"
                    />
                    <input
                            bind:value={password}
                            on:keydown={(e) => {
                                if (e.key === "Enter") createUser(email, password);
                            }}
                            type="password"
                            required
                            class="appearance-none rounded-md mb-6 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all duration-200"
                            placeholder="Password"
                    />
                    <button
                            on:click={createUser(email, password)}
                            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
                        Create User
                    </button>
                {/if}
                {#if $user}
                    <button
                            on:click={handleSignOut}
                            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                    >
                        Sign Out
                    </button>
                {/if}
            </div>
        </nav>
    </header>

    <main class="flex-grow container mx-auto px-4 py-8">
        {#if $user}
            <div
                    in:fade={{ duration: 300 }}
                    class="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
                <HabitList/>
                <Analytics/>
            </div>
        {:else}
            <div in:fade={{ duration: 300 }}>
                <Auth/>
            </div>
        {/if}
    </main>

    <footer
            class="bg-white shadow-lg mt-auto"
            in:fly={{ y: 20, duration: 500 }}
    >
        <div class="container mx-auto px-4 py-6">
            <div class="flex justify-between items-center">
                <p class="text-gray-600">
                    © {new Date().getFullYear()} Glumf Industries
                </p>
            </div>
        </div>
    </footer>
</div>
