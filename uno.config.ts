import { defineConfig, presetWind3, transformerDirectives } from 'unocss'


export default defineConfig({
    presets:[
        presetWind3(),
      ],
      
    theme:{
        colors:{
            'brand':{
                10: 'var(--br-10  )',
                20: 'var(--br-20  )',
                30: 'var(--br-30  )',
                40: 'var(--br-40  )',
                50: 'var(--br-50  )',
                60: 'var(--br-60  )',
                1: 'var(--br-100  )',
                2: 'var(--br-200  )',
               
            } 
        }
    },
    shortcuts:{
        "container":"px-8 lg:px-16",
        "seccion-base"   : "py-16 md:py-24 lg:py-36",
        "ic"             : "items-center",
        "icc"            : "items-center justify-center",
        "icb"            : "items-center justify-between",
        "lh2"            : "leading-8 md:leading-10",
        "t4i"            : "grid md:flex gap-4 leading-8 md:leading-10 items-center gap-4",
        "sidelink"     : "text-white/60 hover:text-white/80 flex items-center gap-2 py-2",
        "sidelink active" : "text-white/80 bg-white/10 rounded-md",
        
        "fs-xs":   "var(--fs-xs)",
        "fs-sm":   "var(--fs-sm)",
        "fs-base": "var(--fs-base)",
        "fs-md":   "var(--fs-md)",
        "fs-lg":   "var(--fs-lg)",
        "fs-xl":   "var(--fs-xl)",
        "fs-2xl":  "var(--fs-2xl)",
        "fs-3xl":  "var(--fs-3xl)",
        "fs-4xl":  "var(--fs-4xl)",
        "fs-5xl":  "var(--fs-5xl)",
        "fs-6xl":  "var(--fs-6xl)",
        "fs-7xl":  "var(--fs-7xl)",
        "fs-8xl":  "var(--fs-8xl)",
        "fs-9xl":  "var(--fs-9xl)",
  
      
      },
      transformers: [
        transformerDirectives(),
      ],  
      
 

})