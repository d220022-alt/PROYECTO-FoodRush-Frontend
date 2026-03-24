import os
import re

base_dir = r"c:\Users\yirbe\OneDrive\Escritorio\fronted\PROYECTO-FoodRush-Frontend\src\views"
sb_path = os.path.join(base_dir, "Starbucks.vue")
out_path = os.path.join(base_dir, "McDonalds.vue")

with open(sb_path, "r", encoding="utf-8") as f:
    text = f.read()

# colors
text = text.replace("#00704A", "#DB0007") # Primary red
text = text.replace("#005c3d", "#AD0005") # Hover red
text = text.replace("#D4E9E2", "#FFEBEC") # Soft red background
text = text.replace("#1e3932", "#3D0002") # Dark red text

# logo
text = text.replace("https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png", "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1200px-McDonald%27s_Golden_Arches.svg.png")
text = text.replace('alt="Starbucks Logo"', 'alt="McDonalds Logo"')
text = text.replace('alt="Starbucks Slide"', 'alt="McDonalds Slide"')

# slides
text = re.sub(r"const slides = \[.*?\];", """const slides = [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1600&q=80'
];""", text, flags=re.DOTALL)

# API mapping
text = text.replace("f.nombre === 'Starbucks' || f.nombre === 'Starbucks Coffee'", "f.nombre === 'McDonald\\'s' || f.nombre === 'McDonalds'")
text = text.replace("'Starbucks'", "'McDonalds'")

# Categories & labels
text = text.replace("currentCategory.value === 'Bebidas'", "currentCategory.value === 'Hamburguesas'")
text = text.replace("currentCategory = ref('Bebidas')", "currentCategory = ref('Hamburguesas')")
text = text.replace("Buscar tu café favorito...", "Buscar tu comida favorita...")

# Tabs
tabs_html = """                <button @click="setCategory('Hamburguesas')"
                        :class="['filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap', currentCategory === 'Hamburguesas' ? 'active' : 'border-gray-200 text-gray-600']">
                    Hamburguesas
                </button>
                <button @click="setCategory('Complementos')"
                        :class="['filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap', currentCategory === 'Complementos' ? 'active' : 'border-gray-200 text-gray-600']">
                    Complementos
                </button>
                <button @click="setCategory('Bebidas')"
                        :class="['filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap', currentCategory === 'Bebidas' ? 'active' : 'border-gray-200 text-gray-600']">
                    Bebidas
                </button>
                <button @click="setCategory('Postres')"
                        :class="['filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap', currentCategory === 'Postres' ? 'active' : 'border-gray-200 text-gray-600']">
                    Postres
                </button>"""

text = re.sub(r"<button @click=\"setCategory\('Bebidas'\)\"(.|\n)*?Café en Grano\s*</button>", tabs_html, text)

# Sidebar mapping
sidebar_js = """const sidebarConfig = computed(() => {
    if (currentCategory.value === 'Hamburguesas') {
        return { typeLabel: 'Tipo de Hamburguesa', types: [{ key: 'Res', label: 'Res' }, { key: 'Pollo', label: 'Pollo' }], showCaffeine: false };
    } else if (currentCategory.value === 'Complementos') {
        return { typeLabel: 'Tipo', types: [{ key: 'Papas', label: 'Papas' }], showCaffeine: false };
    } else if (currentCategory.value === 'Bebidas') {
        return { typeLabel: 'Tipo de Bebida', types: [{ key: 'Refresco', label: 'Refresco' }, { key: 'Jugo', label: 'Jugo' }], showCaffeine: true };
    } else {
        return { typeLabel: 'Tipo', types: [{ key: 'Helado', label: 'Helado' }, { key: 'Pastel', label: 'Pastel'}], showCaffeine: false };
    }
});"""

text = re.sub(r"const sidebarConfig = computed\(\(\) => \{(.|\n)*?\}\);", sidebar_js, text)

# Fallback Products adjustment
text = text.replace('category: "Bebidas"', 'category: "Hamburguesas"')
text = text.replace('category: "Comida"', 'category: "Complementos"')
text = text.replace('category: "Café en Casa"', 'category: "Postres"')
text = text.replace("category === 'Bebidas'", "category === 'Bebidas' || selectedProduct.category === 'Hamburguesas'")

with open(out_path, "w", encoding="utf-8") as f:
    f.write(text)

print(f"File updated thoroughly: {out_path}")
