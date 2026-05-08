/*
  Guia rapida para presentar:
  Opciones de personalizacion por productos: tamanos, extras, bebidas, combos y ajustes.
  Buscar en VS Code: modificadores, opciones producto, tamanos, extras, cafe, carrito.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
export const categoryModifiers = {
    Hamburguesas: [
        { id: 'meat', label: 'Tipo de Carne', type: 'choice', options: ['Res', 'Pollo', 'Pescado', 'Veggie'], default: 'Res', price: 0 },
        { id: 'cheese', label: 'Queso Extra', type: 'counter', max: 3, price: 30 },
        { id: 'bacon', label: 'Tocino Extra', type: 'counter', max: 2, price: 45 },
        { id: 'sauce', label: 'Salsas Extra', type: 'counter', max: 5, price: 20 },
        { id: 'combo', label: 'Hacer Combo (Papas + Refresco)', type: 'toggle', price: 150 },
    ],
    Pizzas: [
        { id: 'size', label: 'Tamaño', type: 'choice', options: ['Pequeña', 'Mediana', 'Familiar'], default: 'Mediana', priceOptions: { 'Pequeña': -50, 'Mediana': 0, 'Familiar': 150 } },
        { id: 'crust', label: 'Orilla', type: 'choice', options: ['Clásica', 'Delgada', 'Rellena de Queso'], default: 'Clásica', priceOptions: { 'Rellena de Queso': 90 } },
        { id: 'extraCheese', label: 'Doble Queso', type: 'toggle', price: 70 },
        { id: 'sauce', label: 'Salsa Extra', type: 'counter', max: 3, price: 25 },
    ],
    Bebidas: [
        { id: 'size', label: 'Tamaño', type: 'choice', options: ['Regular', 'Grande', 'Venti'], default: 'Regular', priceOptions: { 'Grande': 40, 'Venti': 70 } },
        { id: 'ice', label: 'Hielo', type: 'choice', options: ['Sin Hielo', 'Poco Hielo', 'Regular', 'Extra Hielo'], default: 'Regular', price: 0 },
        { id: 'milk', label: 'Leche (solo café)', type: 'choice', options: ['Entera', 'Descremada', 'Almendra (+30)', 'Avena (+40)', 'Soya (+30)'], default: 'Entera', priceOptions: { 'Almendra (+30)': 30, 'Avena (+40)': 40, 'Soya (+30)': 30 } },
        { id: 'syrup', label: 'Shot de Sabor Extra', type: 'counter', max: 3, price: 35 },
    ],
    Pollo: [
        { id: 'style', label: 'Estilo', type: 'choice', options: ['Crispy', 'Original', 'Spicy'], default: 'Crispy', price: 0 },
        { id: 'combo', label: 'Hacer Combo (Acompañante + Refresco)', type: 'toggle', price: 160 },
        { id: 'sauce', label: 'Salsas Extra', type: 'counter', max: 5, price: 25 },
    ],
    Res: [
        { id: 'style', label: 'Estilo', type: 'choice', options: ['Salteado', 'Teriyaki', 'Picante'], default: 'Salteado', price: 0 },
        { id: 'sauce', label: 'Salsa Extra', type: 'counter', max: 4, price: 20 },
        { id: 'combo', label: 'Hacer Combo (Arroz + Refresco)', type: 'toggle', price: 160 },
    ],
    Postres: [
        { id: 'size', label: 'Tamaño', type: 'choice', options: ['Normal', 'Grande'], default: 'Normal', priceOptions: { 'Grande': 50 } },
        { id: 'topping', label: 'Topping Extra', type: 'counter', max: 3, price: 30 },
        { id: 'syrup', label: 'Sirope Extra', type: 'counter', max: 2, price: 20 },
    ],
    Tacos: [
        { id: 'meat', label: 'Carne', type: 'choice', options: ['Res', 'Pollo', 'Cerdo', 'Veggie'], default: 'Res', price: 0 },
        { id: 'shell', label: 'Tortilla', type: 'choice', options: ['Suave', 'Crujiente'], default: 'Suave', price: 0 },
        { id: 'extraCheese', label: 'Queso Extra', type: 'toggle', price: 25 },
        { id: 'spicy', label: 'Salsa Picante', type: 'counter', max: 3, price: 15 },
        { id: 'combo', label: 'Hacer Combo (Nachos + Refresco)', type: 'toggle', price: 140 },
    ],
    HotDogs: [
        { id: 'sausage', label: 'Salchicha', type: 'choice', options: ['Normal', 'Jumbo', 'Pollo'], default: 'Normal', priceOptions: { 'Jumbo': 40 } },
        { id: 'extraSauce', label: 'Salsa Extra', type: 'counter', max: 3, price: 15 },
        { id: 'bacon', label: 'Tocino', type: 'toggle', price: 35 },
        { id: 'combo', label: 'Hacer Combo (Papas + Refresco)', type: 'toggle', price: 130 },
    ],
    Pastas: [
        { id: 'size', label: 'Tamaño', type: 'choice', options: ['Individual', 'Para Compartir'], default: 'Individual', priceOptions: { 'Para Compartir': 180 } },
        { id: 'extraCheese', label: 'Queso Parmesano Extra', type: 'toggle', price: 40 },
        { id: 'bread', label: 'Pan de Ajo Extra', type: 'counter', max: 4, price: 30 },
    ],
    Complementos: [
        { id: 'size', label: 'Tamaño', type: 'choice', options: ['Regular', 'Grande', 'Familiar'], default: 'Regular', priceOptions: { 'Grande': 40, 'Familiar': 90 } },
        { id: 'sauce', label: 'Dip o Salsa', type: 'counter', max: 5, price: 25 },
    ],
    Combos: [
        { id: 'size', label: 'Tamaño', type: 'choice', options: ['Regular', 'Grande', 'Familiar'], default: 'Regular', priceOptions: { 'Grande': 50, 'Familiar': 110 } },
        { id: 'side', label: 'Acompañante', type: 'choice', options: ['Papas', 'Ensalada', 'Arroz'], default: 'Papas', price: 0 },
        { id: 'drink', label: 'Bebida', type: 'choice', options: ['Refresco', 'Agua', 'Jugo'], default: 'Refresco', priceOptions: { 'Jugo': 25 } },
        { id: 'sauce', label: 'Salsas Extra', type: 'counter', max: 3, price: 15 },
    ],
    Platos: [
        { id: 'side', label: 'Acompañante', type: 'choice', options: ['Papas', 'Ensalada', 'Vegetales'], default: 'Papas', price: 0 },
        { id: 'sauce', label: 'Salsa', type: 'choice', options: ['BBQ', 'Chipotle', 'Mostaza', 'Sin salsa'], default: 'Sin salsa', price: 0 },
        { id: 'spice', label: 'Toque Picante', type: 'toggle', price: 20 },
        { id: 'extra', label: 'Extra Proteína', type: 'toggle', price: 90 },
    ],
    General: [
        { id: 'size', label: 'Tamaño', type: 'choice', options: ['Normal', 'Agrandar'], default: 'Normal', priceOptions: { 'Agrandar': 60 } },
    ],
};

const normalizeCategory = (value) => {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

const getCategoryTokens = (value) => normalizeCategory(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const hasAnyToken = (tokens, values) => values.some((value) => tokens.includes(value));
const includesAny = (value, fragments) => fragments.some((fragment) => value.includes(fragment));

export const getModifiersForCategory = (category) => {
    // Find exact or map to generic fallback (e.g. "Donas" -> Postres, "Combos" -> Combos)
    const normalizedCat = normalizeCategory(category);
    const tokens = getCategoryTokens(category);

    if (includesAny(normalizedCat, ['postre', 'dona', 'donut', 'helado', 'sundae', 'batida'])) {
        return categoryModifiers.Postres;
    }
    if (
        includesAny(normalizedCat, ['carne de res', 'teriyaki beef', 'beijing beef']) ||
        hasAnyToken(tokens, ['res', 'beef'])
    ) {
        return categoryModifiers.Res;
    }
    if (
        includesAny(normalizedCat, ['hamburguesa', 'burger', 'chimi']) ||
        hasAnyToken(tokens, ['hamburguesas'])
    ) {
        return categoryModifiers.Hamburguesas;
    }
    if (normalizedCat.includes('pizza')) return categoryModifiers.Pizzas;
    if (
        normalizedCat.includes('bebida') ||
        normalizedCat.includes('cafe') ||
        normalizedCat.includes('frappe') ||
        normalizedCat.includes('te')
    ) {
        return categoryModifiers.Bebidas;
    }
    if (normalizedCat.includes('pollo')) return categoryModifiers.Pollo;
    if (normalizedCat.includes('taco') || normalizedCat.includes('burrito') || normalizedCat.includes('nacho')) {
        return categoryModifiers.Tacos;
    }
    if (normalizedCat.includes('hot dog') || normalizedCat.includes('hotdog')) return categoryModifiers.HotDogs;
    if (normalizedCat.includes('pasta')) return categoryModifiers.Pastas;
    if (
        normalizedCat.includes('acompanante') ||
        normalizedCat.includes('acompanantes') ||
        normalizedCat.includes('complemento')
    ) {
        return categoryModifiers.Complementos;
    }
    if (normalizedCat.includes('combo')) return categoryModifiers.Combos;
    if (includesAny(normalizedCat, ['plato', 'bowl', 'arroz', 'chow mein', 'noodle'])) return categoryModifiers.Platos;

    return categoryModifiers.General;
};
