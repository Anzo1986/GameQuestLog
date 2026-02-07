<script setup>
import { computed, ref } from 'vue';
import { X, Trophy, Clock, AlertCircle, Crown, Gamepad2, Monitor, Star, Flame } from 'lucide-vue-next';
import { useGames } from '../composables/useGames';
import { useSettings } from '../composables/useSettings';
import { useDailyLogin } from '../composables/useDailyLogin';
import { GENRES } from '../constants/genres';
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

defineEmits(['close', 'open-timeline']);

const { gameStats, userLevel, userTitle } = useGames();
const { themeColor, THEMES } = useSettings();
const { loginState } = useDailyLogin();

const activeChart = ref(null);

const topGenre = computed(() => {
    if (!gameStats.value) return 'N/A';
    const g = gameStats.value.genreCounts;
    const sorted = Object.entries(g).sort((a,b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : 'None';
});

const topPlatform = computed(() => {
    if (!gameStats.value) return 'N/A';
    const p = gameStats.value.platformCounts;
    const sorted = Object.entries(p).sort((a,b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : 'None';
});

// Helper to get current theme RGB
const primaryColorRgb = computed(() => {
    return THEMES[themeColor.value]?.rgb || '59 130 246';
});

// 1. Status Doughnut Chart
const statusChartData = computed(() => {
    if (!gameStats.value) return null;
    const s = gameStats.value.statusCounts;
    return {
        labels: ['Playing', 'Completed', 'Dropped', 'Backlog'],
        datasets: [{
            backgroundColor: ['#3b82f6', '#22c55e', '#6b7280', '#ef4444'], // blue, green, gray, red
            data: [s.playing, s.completed, s.dropped, s.backlog]
        }]
    };
});

const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 800,
        easing: 'easeOutQuart'
    },
    plugins: {
        legend: { display: false },
        tooltip: {
            animation: false // Disable tooltip animation for performance
        }
    }
};


// 2. Genre Radar Data
const genreChartData = computed(() => {
    if (!gameStats.value) return null;
    const g = gameStats.value.genreCounts;
    
    // 1. Map & Abbreviate
    const ABBREVIATIONS = {
        'Massively Multiplayer': 'MMO',
        'Role-playing Games': 'RPG',
        'Board Games': 'Board',
        'Casual': 'Casual',
        'Indie': 'Indie',
    };

    // Convert to array of { name, count }
    // We iterate over the actual counts present in the data, not just the static list, 
    // to ensure we capture everything, but GENRES constant is safer if we want fixed order.
    // However, for Radar chart with grouping, dynamic is better.
    let allGenres = Object.entries(g).map(([name, count]) => ({
        name: ABBREVIATIONS[name] || name,
        count
    }));

    // 2. Sort Descending
    allGenres.sort((a, b) => b.count - a.count);

    // 3. Group (Top 6 + Other)
    const topN = 6;
    if (allGenres.length > topN) {
         const top = allGenres.slice(0, topN);
         const others = allGenres.slice(topN);
         const otherCount = others.reduce((sum, item) => sum + item.count, 0);
         
         // Only add 'Others' if there is actually meaningful data there
         if (otherCount > 0) {
             top.push({ name: 'Others', count: otherCount });
         }
         
         allGenres = top;
    }

    return {
        labels: allGenres.map(obj => obj.name),
        datasets: [{
            label: 'Genre Distribution',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: '#3b82f6',
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#3b82f6',
            data: allGenres.map(obj => obj.count)
        }]
    };
});

const genreChartOptions = computed(() => {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 800
        },
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: { 
                    color: '#9ca3af', 
                    font: { 
                        size: 11
                    }
                },
                ticks: { 
                    backdropColor: 'transparent', 
                    display: false 
                },
                suggestedMin: 0,
                suggestedMax: 4
            }
        },
        plugins: { 
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => ` ${context.label}: ${context.raw}`
                }
            }
        }
    };
});

// 3. Platform Bar Data
const platformChartData = computed(() => {
    if (!gameStats.value) return null;
    const p = gameStats.value.platformCounts;
    const sortedPlatforms = Object.entries(p).sort((a,b) => b[1] - a[1]).slice(0, 5);
    
    // Use Theme Color for Platform Bars
    // Ensure properly formatted RGB for Chart.js (needs commas for legacy rgba or slash for modern rgb)
    // defined as 'RRR GGG BBB' in settings
    let c = primaryColorRgb.value;
    if (c.includes(' ')) {
        c = c.split(' ').join(',');
    }

    return {
        labels: sortedPlatforms.map(i => i[0]),
        datasets: [{
            label: 'Games Owned',
            backgroundColor: `rgba(${c}, 0.8)`,
            hoverBackgroundColor: `rgba(${c}, 1.0)`,
            data: sortedPlatforms.map(i => i[1]),
            borderRadius: 4
        }]
    };
});

const platformChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 800
    },
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
            <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--primary-rgb))] to-purple-500 uppercase tracking-widest">
                Career Stats
            </h2>
            <p class="text-gray-400 text-sm">Your gaming journey encoded in data.</p>
          </div>
          <div class="flex items-center gap-2">
            <button 
                @click="$emit('open-timeline')" 
                class="flex items-center gap-2 bg-gradient-to-r from-[rgb(var(--primary-rgb))] to-purple-600 hover:from-[rgb(var(--primary-rgb))]/80 hover:to-purple-500 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95"
            >
                <Clock class="w-4 h-4" /> Journey
            </button>
            <button @click="$emit('close')" class="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                <X class="w-6 h-6" />
            </button>
          </div>
      </div>

      <!-- Scrollable Content -->
      <div class="overflow-y-auto p-6 flex-1 space-y-8 custom-scrollbar">
        
        <!-- 1. Hero Cards Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" v-if="gameStats && !activeChart">
            
            <!-- XP Level -->
            <div class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent group-hover:from-yellow-500/20 transition-colors"></div>
                <Crown class="w-8 h-8 text-yellow-500 mb-2 drop-shadow-md" />
                <h3 class="text-3xl font-black text-white">{{ userLevel }}</h3>
                <p class="text-xs text-yellow-400 uppercase tracking-wider font-bold">{{ userTitle }}</p>
                <!-- Remove View Journey text as requested -->
            </div>

            <!-- LIBRARY STATUS (Opens Chart) -->
            <div 
                @click="activeChart = 'status'"
                class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-blue-500/50 transition-all cursor-pointer hover:scale-[1.02]"
            >
                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-colors"></div>
                <div class="bg-blue-500/20 p-2 rounded-full mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pie-chart"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                </div>
                <h3 class="text-xl font-black text-white">Library</h3>
                <p class="text-xs text-blue-400 uppercase tracking-wider font-bold">Status</p>
            </div>

             <!-- NEW: Average Rating -->
            <div 
                class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group"
            >
                <div class="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent group-hover:from-yellow-500/20 transition-colors"></div>
                <Star class="w-8 h-8 text-yellow-500 mb-2 drop-shadow-md" />
                <h3 class="text-3xl font-black text-white">{{ gameStats.averageRating }}</h3>
                <p class="text-xs text-yellow-400 uppercase tracking-wider font-bold">Ø Rating</p>
            </div>

             <!-- NEW: Daily Streak -->
            <div 
                class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group"
            >
                <div class="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent group-hover:from-orange-500/20 transition-colors"></div>
                <Flame class="w-8 h-8 text-orange-500 mb-2 drop-shadow-md" />
                <h3 class="text-3xl font-black text-white">{{ loginState.currentStreak }}</h3>
                <p class="text-xs text-orange-400 uppercase tracking-wider font-bold">Daily Streak</p>
            </div>

            <!-- Completion Rate (Static) -->
            <div 
                class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group"
            >
                <div class="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent group-hover:from-green-500/20 transition-colors"></div>
                <Trophy class="w-8 h-8 text-green-500 mb-2 drop-shadow-md" />
                <h3 class="text-3xl font-black text-white">{{ gameStats.completionRate }}%</h3>
                <p class="text-xs text-green-400 uppercase tracking-wider font-bold">Completion</p>
                <!-- Removed 'Tap for details' -->
            </div>

             <!-- Total Playtime -->
            <div class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent group-hover:from-blue-500/20 transition-colors"></div>
                <Clock class="w-8 h-8 text-blue-500 mb-2 drop-shadow-md" />
                <h3 class="text-3xl font-black text-white">{{ gameStats.totalDurationDays }}d</h3>
                <p class="text-xs text-blue-400 uppercase tracking-wider font-bold">Total Duration</p>
            </div>

            <!-- Pile of Shame (Non-Clickable) -->
            <div 
                class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group"
            >
                <div class="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent group-hover:from-red-500/20 transition-colors"></div>
                <AlertCircle class="w-8 h-8 text-red-500 mb-2 drop-shadow-md" />
                <h3 class="text-3xl font-black text-white">{{ gameStats.statusCounts.backlog }}</h3>
                <p class="text-xs text-red-400 uppercase tracking-wider font-bold">Backlog Size</p>
            </div>

            <!-- TOP GENRE (NEW) -->
             <div 
                @click="activeChart = 'genre'"
                class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-purple-500/50 transition-all cursor-pointer hover:scale-[1.02]"
            >
                <div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent group-hover:from-purple-500/20 transition-colors"></div>
                <Gamepad2 class="w-8 h-8 text-purple-500 mb-2 drop-shadow-md" />
                <h3 class="text-xl font-black text-white truncate max-w-full px-2">{{ topGenre }}</h3>
                <p class="text-xs text-purple-400 uppercase tracking-wider font-bold mt-1">Top Genre</p>
                <!-- Removed 'Tap for DNA' -->
            </div>

             <!-- TOP PLATFORM (NEW) -->
             <div 
                @click="activeChart = 'platform'"
                class="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-[rgb(var(--primary-rgb))]/50 transition-all cursor-pointer hover:scale-[1.02]"
            >
                <div class="absolute inset-0 bg-gradient-to-br from-[rgb(var(--primary-rgb))]/10 to-transparent group-hover:from-[rgb(var(--primary-rgb))]/20 transition-colors"></div>
                <Monitor class="w-8 h-8 text-[rgb(var(--primary-rgb))] mb-2 drop-shadow-md" style="color: rgb(var(--primary-rgb))" />
                <h3 class="text-xl font-black text-white truncate max-w-full px-2">{{ topPlatform }}</h3>
                <p class="text-xs text-[rgb(var(--primary-rgb))] uppercase tracking-wider font-bold mt-1">Main Platform</p>
                <!-- Removed 'Tap for Wars' -->
            </div>
        </div>

        <!-- Dedicated Library Status Button Removed -->

        <!-- 2. Charts Details (Conditional) -->
        <div v-if="gameStats && activeChart" class="flex-1 flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
            <button @click="activeChart = null" class="self-start mb-4 text-sm flex items-center gap-2 text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                ← Back to Overview
            </button>

            <!-- Status Chart -->
            <div v-if="activeChart === 'status'" class="bg-gray-800/40 rounded-3xl p-6 border border-gray-700/50 flex flex-col h-full max-h-[400px]">
                <h4 class="text-lg font-bold text-gray-200 mb-4 border-l-4 border-blue-500 pl-3">Library Status</h4>
                <div class="flex-1 min-h-[250px] relative">
                    <Doughnut :data="statusChartData" :options="statusChartOptions" />
                </div>
                <!-- Custom Legend -->
                <div class="mt-4 grid grid-cols-2 gap-2" v-if="statusChartData">
                    <div v-for="(label, index) in statusChartData.labels" :key="label" class="flex items-center space-x-2">
                        <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: statusChartData.datasets[0].backgroundColor[index] }"></span>
                        <span class="text-sm text-gray-300">{{ label }}: {{ statusChartData.datasets[0].data[index] }}</span>
                    </div>
                </div>
            </div>

            <!-- Genre Chart -->
            <div v-if="activeChart === 'genre'" class="bg-gray-800/40 rounded-3xl p-6 border border-gray-700/50 flex flex-col h-full max-h-[500px]">
                <h4 class="text-lg font-bold text-gray-200 mb-4 border-l-4 border-purple-500 pl-3">Genre DNA</h4>
                <div class="flex-1 min-h-[300px] relative">
                    <Radar :data="genreChartData" :options="genreChartOptions" />
                </div>
            </div>

            <!-- Platform Chart -->
            <div v-if="activeChart === 'platform'" class="bg-gray-800/40 rounded-3xl p-6 border border-gray-700/50 flex flex-col h-full max-h-[400px]">
                <h4 class="text-lg font-bold text-gray-200 mb-4 border-l-4 border-[rgb(var(--primary-rgb))] pl-3" style="border-color: rgb(var(--primary-rgb))">Platform Wars</h4>
                <div class="flex-1 min-h-[300px] relative">
                    <Bar :data="platformChartData" :options="platformChartOptions" />
                </div>
            </div>
        </div>

         <!-- Empty State -->
        <div v-if="!gameStats" class="h-64 flex flex-col items-center justify-center text-gray-500">
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
