<script lang="ts">
  import { onMount } from 'svelte';
  import { Line } from 'svelte-chartjs';
  import { supabase } from './supabase';
  import { habits, user } from './stores';
  import { format, subDays } from 'date-fns';
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );

  let completionData: {
    labels: string[];
    datasets: any[];
  } = {
    labels: [],
    datasets: [],
  };

  async function loadAnalytics() {
    const days = 7;
    const dates = Array.from({ length: days }, (_, i) => {
      return format(subDays(new Date(), i), 'yyyy-MM-dd');
    }).reverse();

    const { data: checks } = await supabase
      .from('habit_checks')
      .select('habit_id, date')
      .eq('user_id', $user?.id)
      .in('date', dates);

    completionData = {
      labels: dates.map((date) => format(new Date(date), 'MMM d')),
      datasets: [
        {
          label: 'Habits Completed',
          data: dates.map(
            (date) => checks?.filter((check) => check.date === date).length || 0
          ),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    };
  }

  $: if ($user) {
    loadAnalytics();
  }
</script>

<div class="p-4">
  <h2 class="text-xl font-bold mb-4">
    Analytics, Week of {format(new Date(), 'yyyy-MM-dd')}
  </h2>
  <div class="bg-white p-4 rounded shadow">
    <Line
      data={completionData}
      options={{ responsive: true }}
    />
  </div>
</div>
