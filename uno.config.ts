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
        "btn"           : [],
        "lh2"            : "leading-8 md:leading-10",
        "t4i"            : "grid md:flex gap-4 leading-8 md:leading-10 items-center gap-4",
  
      
      },
      transformers: [
        transformerDirectives(),
      ],  
      
 

})