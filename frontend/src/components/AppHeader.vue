<template>
  <header 
    class="w-full flex flex-row justify-between items-center px-4 sm:px-6 md:px-8 py-2 h-16 md:h-20 shadow-md transition-all duration-300 shrink-0 bg-[#17365D] text-white border-b border-[#002244]"
  >
    <!-- Contenedor escudo izquierdo -->
    <div class="w-[15%] p-1 flex justify-start items-center">
      <img 
        src="/assets/escudos-institucionales/0.PFA.png" 
        alt="Escudo PFA"
        class="w-10 sm:w-12 md:w-14 max-h-12 md:max-h-14 object-contain filter drop-shadow"
      />
    </div>
    
    <!-- Título Central -->
    <div class="flex-1 flex flex-col justify-center items-center text-center">
      <span class="text-xs sm:text-sm font-semibold tracking-widest text-[#E6C027] uppercase">
        Policía Federal Argentina
      </span>
      <h1 class="font-extrabold text-sm sm:text-lg md:text-xl lg:text-2xl tracking-wide leading-tight">
        DISCRIMINADOR DE ELEMENTOS SECUESTRADOS
      </h1>
    </div>
    
    <!-- Contenedor logo derecho -->
    <div class="w-[15%] p-1 flex justify-end items-center">
      <img 
        src="/assets/logo.svg" 
        alt="Logo DGIC"
        class="w-10 sm:w-12 md:w-14 max-h-12 md:max-h-14 object-contain filter drop-shadow transition-transform hover:scale-105"
      />
    </div>
  </header>
</template>

<script setup>
</script>
