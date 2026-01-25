<script setup>
import { computed } from 'vue';
import { X, Trophy, Clock, AlertCircle, Crown } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Doughnut, Radar, Bar } from 'vue-chartjs';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

defineProps({
  isOpen: Boolean
});

defineEmits(['close']);

const { gameStats, userLevel, userTitle } = useGames();

// 1. Status Doughnut Chart
const statusChartData = computed(() => {
    if (!gameStats.value) return null;
    const s = gameStats.value.statusCounts;
    return {
        labels: ['Playing', 'Completed', 'Dropped', 'Backlog'],
        datasets: [{
            backgroundColor: ['#3b82f6', '#22c55e', '#6b7280', '#fbbf24'], // blue, green, gray, yellow
            data: [s.playing, s.completed, s.dropped, s.backlog]
        }]
    };
});

const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom', labels: { color: '#9ca3af' } }
    }
};

// 2. Genre Radar Data
const genreChartData = computed(() => {
    if (!gameStats.value) return null;
    const g = gameStats.value.genreCounts;
    // Get top 6 genres
    const sortedGenres = Object.entries(g).sort((a,b) => b[1] - a[1]).slice(0, 6);
    
    return {
        labels: sortedGenres.map(i => i[0]),
        datasets: [{
            label: 'Genre Distribution',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: '#3b82f6',
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            data: sortedGenres.map(i => i[1])
        }]
    };
});

const genreChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            pointLabels: { color: '#e5e7eb', font: { size: 12 } },
            ticks: { backdropColor: 'transparent', color: 'transparent' } // Hide numbers
        }
    },
    plugins: { legend: { display: false } }
};

// 3. Platform Bar Data
const platformChartData = computed(() => {
    if (!gameStats.value) return null;
    const p = gameStats.value.platformCounts;
    const sortedPlatforms = Object.entries(p).sort((a,b) => b[1] - a[1]).slice(0, 5);

    return {
        labels: sortedPlatforms.map(i => i[0]),
        datasets: [{
            label: 'Games Owned',
            backgroundColor: '#8b5cf6',
            data: sortedPlatforms.map(i => i[1]),
            borderRadius: 4
        }]
    };
});

const platformChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#9ca3af' } },
        y: { grid: { display: false }, ticks: { color: '#e5e7eb' } }
    },
    plugins: { legend: { display: false } }
};

</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/95 backdrop-blur-md" @click="$emit('close')"></div>

    <!-- Modal Container -->
    <div class="relative w-full max-w-5xl h-[90vh] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
      
      <!-- Header -->
      <div class="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 backdrop-blur z-20 sticky top-0">
          <div>
            <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 uppercase tracking-widest">
                Career Stats
            </h2>
            <p class="text-gray-400 text-sm">Your gaming journey encoded in data.</p>
          </div>
          <button @click="$emit('close')" class="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
              <X class="w-6 h-6" />
          </button>
      </div>

      <!-- Scrollable Content -->
      <div class="overflow-y-auto p-6 flex-1 space-y-8 custom-scrollbar">
        
        <!-- 1. Hero Cards Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" v-if="gameStats">
            
            <!-- XP Level -->
            <div class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent group-hover:from-yellow-500/20 transition-colors"></div>
                <Crown class="w-8 h-8 text-yellow-500 mb-2 drop-shadow-md" />
                <h3 class="text-3xl font-black text-white">{{ userLevel }}</h3>
                <p class="text-xs text-yellow-400 uppercase tracking-wider font-bold">{{ userTitle }}</p>
            </div>

            <!-- Completion Rate -->
            <div class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent group-hover:from-green-500/20 transition-colors"></div>
                <Trophy class="w-8 h-8 text-green-500 mb-2 drop-shadow-md" />
                <h3 class="text-3xl font-black text-white">{{ gameStats.completionRate }}%</h3>
                <p class="text-xs text-green-400 uppercase tracking-wider font-bold">Completion</p>
            </div>

             <!-- Total Playtime -->
            <div class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-colors"></div>
                <Clock class="w-8 h-8 text-blue-500 mb-2 drop-shadow-md" />
                <h3 class="text-3xl font-black text-white">{{ gameStats.totalPlaytime }}h</h3>
                <p class="text-xs text-blue-400 uppercase tracking-wider font-bold">Time Invested</p>
            </div>

             <!-- Pile of Shame -->
            <div class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent group-hover:from-red-500/20 transition-colors"></div>
                <AlertCircle class="w-8 h-8 text-red-500 mb-2 drop-shadow-md" />
                <h3 class="text-3xl font-black text-white">{{ gameStats.statusCounts.backlog }}</h3>
                <p class="text-xs text-red-400 uppercase tracking-wider font-bold">Backlog Size</p>
            </div>
        </div>

        <!-- 2. Charts Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" v-if="gameStats">
            
            <!-- Doughnut: Status -->
            <div class="bg-gray-800/40 rounded-3xl p-6 border border-gray-700/50 flex flex-col">
                <h4 class="text-lg font-bold text-gray-200 mb-4 border-l-4 border-blue-500 pl-3">Library Status</h4>
                <div class="flex-1 min-h-[250px] relative">
                    <Doughnut :data="statusChartData" :options="statusChartOptions" />
                </div>
            </div>

            <!-- Radar: Genres -->
            <div class="bg-gray-800/40 rounded-3xl p-6 border border-gray-700/50 flex flex-col">
                <h4 class="text-lg font-bold text-gray-200 mb-4 border-l-4 border-purple-500 pl-3">Genre DNA</h4>
                <div class="flex-1 min-h-[250px] relative">
                    <Radar :data="genreChartData" :options="genreChartOptions" />
                </div>
            </div>

            <!-- Bar: Platforms -->
            <div class="bg-gray-800/40 rounded-3xl p-6 border border-gray-700/50 flex flex-col md:col-span-2 lg:col-span-1">
                <h4 class="text-lg font-bold text-gray-200 mb-4 border-l-4 border-indigo-500 pl-3">Platform Wars</h4>
                <div class="flex-1 min-h-[250px] relative">
                    <Bar :data="platformChartData" :options="platformChartOptions" />
                </div>
            </div>

        </div>

         <!-- Empty State -->
        <div v-else class="h-64 flex flex-col items-center justify-center text-gray-500">
            <p>No game data available yet.</p>
            <p class="text-sm">Start adding games to generate your stats!</p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.2);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}
</style>
