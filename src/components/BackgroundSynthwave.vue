<script setup>
</script>

<template>
  <div class="synthwave-container">
    <div class="sun"></div>
    <div class="grid-plane"></div>
    <div class="horizon-glow"></div>
    <div class="vignette"></div>
  </div>
</template>

<style scoped>
.synthwave-container {
    position: fixed;
    inset: 0;
    z-index: -1;
    background-color: #1a0b2e; /* Dark Purple Sky */
    overflow: hidden;
    perspective: 1000px;
}

/* Retro Sun */
.sun {
    position: absolute;
    top: 10%;
    left: 50%;
    transform: translate(-50%, 0);
    width: 300px;
    height: 300px;
    background: linear-gradient(to bottom, #ffe600, #ff0055);
    border-radius: 50%;
    box-shadow: 0 0 40px #ff0055;
    /* Sun Bars Mask */
    -webkit-mask-image: linear-gradient(to bottom, 
        black 0%, black 50%, 
        transparent 50%, transparent 52%, 
        black 52%, black 58%, 
        transparent 58%, transparent 62%, 
        black 62%, black 70%, 
        transparent 70%, transparent 75%,
        black 75%, black 100%
    );
     mask-image: linear-gradient(to bottom, 
        black 0%, black 50%, 
        transparent 50%, transparent 52%, 
        black 52%, black 58%, 
        transparent 58%, transparent 62%, 
        black 62%, black 70%, 
        transparent 70%, transparent 75%,
        black 75%, black 100%
    );
}

/* 3D Grid Floor */
.grid-plane {
    position: absolute;
    bottom: -30%;
    left: -50%;
    width: 200%;
    height: 100%;
    background-image: 
        linear-gradient(rgba(255, 0, 255, 0.4) 2px, transparent 2px),
        linear-gradient(90deg, rgba(255, 0, 255, 0.4) 2px, transparent 2px);
    background-size: 100px 100px;
    transform: rotateX(60deg);
    transform-origin: 50% 0%;
    animation: grid-move 20s linear infinite;
    box-shadow: 0 0 100px rgba(236, 72, 153, 0.4);
}

@keyframes grid-move {
    0% { background-position: 0 0; }
    100% { background-position: 0 100px; }
}

/* Fade into distance */
.horizon-glow {
    position: absolute;
    top: 40%;
    left: 0;
    width: 100%;
    height: 20%;
    background: linear-gradient(to bottom, #1a0b2e 0%, transparent 100%);
    z-index: 10;
}

/* Vignette for atmosphere */
.vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 40%, #000 120%);
    pointer-events: none;
}
</style>
