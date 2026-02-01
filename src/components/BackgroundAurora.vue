<template>
  <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <div class="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-purple-500/30 rounded-full blur-[100px] animate-blob"></div>
      <div class="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-cyan-500/30 rounded-full blur-[100px] animation-delay-2000 animate-blob"></div>
      <div class="absolute bottom-[-20%] left-[20%] w-[50vh] h-[50vh] bg-pink-500/30 rounded-full blur-[100px] animation-delay-4000 animate-blob"></div>
      <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      
      <!-- Mountain Silhouette -->
      <div class="absolute bottom-0 left-0 right-0 h-48 z-10">
          <svg viewBox="0 0 1440 320" class="w-full h-full" preserveAspectRatio="none">
              <path fill="#000000" fill-opacity="0.8" d="M0,256L48,245.3C96,235,192,213,288,192C384,171,480,149,576,160C672,171,768,213,864,224C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
      </div>
  </div>
</template>

<style scoped>
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
