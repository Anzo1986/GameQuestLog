<template>
  <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <div class="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-purple-500/30 rounded-full blur-[100px] animate-blob"></div>
      <div class="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-cyan-500/30 rounded-full blur-[100px] animation-delay-2000 animate-blob"></div>
      <div class="absolute bottom-[-20%] left-[20%] w-[50vh] h-[50vh] bg-pink-500/30 rounded-full blur-[100px] animation-delay-4000 animate-blob"></div>
      <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
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
