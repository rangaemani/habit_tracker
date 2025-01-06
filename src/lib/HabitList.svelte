<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from './supabase';
  import { habits, user } from './stores';
  import { format } from 'date-fns';
  import { fade, slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  let newHabitName = '';
  let loading = true;
  let habitChecks: Record<string, boolean> = {};

  async function loadHabits() {
    const { data: habitData, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', $user?.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading habits:', error);
      return;
    }

    habits.set(habitData);
    await loadChecks();
    loading = false;
  }

  async function loadChecks() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: checks, error } = await supabase
      .from('habit_checks')
      .select('habit_id')
      .eq('user_id', $user?.id)
      .eq('date', today);

    if (error) {
      console.error('Error loading checks:', error);
      return;
    }

    habitChecks = checks?.reduce((acc, check) => ({
      ...acc,
      [check.habit_id]: true
    }), {});
  }

  async function addHabit() {
    if (!newHabitName.trim()) return;

    const { error } = await supabase
      .from('habits')
      .insert([
        {
          name: newHabitName,
          user_id: $user?.id,
        },
      ]);

    if (error) {
      console.error('Error adding habit:', error);
      return;
    }

    newHabitName = '';
    loadHabits();
  }

  async function toggleHabitCheck(habitId: string) {
    if (habitChecks[habitId]) return; // Prevent unchecking

    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { error: insertError } = await supabase
      .from('habit_checks')
      .insert([
        {
          habit_id: habitId,
          date: today,
          user_id: $user?.id,
        },
      ]);

    if (insertError) {
      console.error('Error checking habit:', insertError);
      return;
    }

    habitChecks[habitId] = true;
    loadHabits();
  }

  $: if ($user) {
    loadHabits();
  }
</script>

<div class="bg-white rounded-lg shadow-lg p-6" in:fade="{{ duration: 300 }}">
  <h2 class="text-2xl font-bold mb-6 text-gray-800">My Habits</h2>
  
  <form 
    on:submit|preventDefault={addHabit}
    class="mb-6 flex gap-2"
  >
    <input
      type="text"
      bind:value={newHabitName}
      placeholder="Enter a new habit..."
      class="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
    />
    <button
      type="submit"
      class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
    >
      Add Habit
    </button>
  </form>

  {#if loading}
    <div class="flex justify-center py-8" in:fade>
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  {:else}
    <div class="space-y-3">
      {#each $habits as habit (habit.id)}
        <div 
          animate:flip="{{ duration: 300 }}"
          in:slide="{{ duration: 300 }}"
          class="flex items-center justify-between p-4 rounded-lg transition-all duration-200 {habitChecks[habit.id] ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 hover:bg-gray-100'}"
        >
          <div class="flex items-center space-x-3">
            {#if habitChecks[habit.id]}
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
            <span class="text-gray-800 {habitChecks[habit.id] ? 'font-medium' : ''}">{habit.name}</span>
          </div>
          <button
            on:click={() => toggleHabitCheck(habit.id)}
            class="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 {habitChecks[habit.id] 
              ? 'bg-green-100 text-green-700 cursor-not-allowed opacity-50' 
              : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}"
            disabled={habitChecks[habit.id]}
          >
            {habitChecks[habit.id] ? 'Completed' : 'Check'}
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>