
export const mockTenants = [
    { id: 1, nombre: "Starbucks Coffee", tema_color: "#00704A" },
    { id: 2, nombre: "McDonald's", tema_color: "#DB0007" },
    { id: 3, nombre: "KFC", tema_color: "#F40026" },
    { id: 4, nombre: "Burger King", tema_color: "#D62300" },
    { id: 5, nombre: "Little Caesars", tema_color: "#FF631C" },
    { id: 6, nombre: "Domino's Pizza", tema_color: "#006491" },
    { id: 7, nombre: "Pizza Hut", tema_color: "#C8102E" },
    { id: 8, nombre: "Krispy Kreme", tema_color: "#D41D35" },
    { id: 9, nombre: "Rico Hot Dog", tema_color: "#FFD200" },
    { id: 10, nombre: "Pizzarelli", tema_color: "#E21D2C" },
    { id: 11, nombre: "Barra Payán", tema_color: "#FFCD00" },
    { id: 12, nombre: "Taco Bell", tema_color: "#702082" },
    { id: 13, nombre: "Helados Bon", tema_color: "#0078C1" },
    { id: 14, nombre: "Chili's Grill & Bar", tema_color: "#D62529" },
    { id: 15, nombre: "Panda Express", tema_color: "#CF232A" }
];

export const mockProducts = [
    // Starbucks
    { id: 101, tenant_id: 1, nombre: "Caramel Macchiato", precio: "295.00", descripcion: "Bebidas - Espresso con vainilla y mucho caramelo.", categoria: "Bebidas" },
    { id: 102, tenant_id: 1, nombre: "Frappuccino Mocha", precio: "325.00", descripcion: "Bebidas - Cafe mezclado con hielo y chocolate.", categoria: "Bebidas" },
    { id: 103, tenant_id: 1, nombre: "Croissant de Mantequilla", precio: "150.00", descripcion: "Postres - Horneado diariamente.", categoria: "Postres" },

    // McDonald's
    { id: 201, tenant_id: 2, nombre: "Big Mac", precio: "275.00", descripcion: "Hamburguesas - Dos carnes, salsa especial, lechuga, pepinillo, cebolla, queso y pan.", categoria: "Hamburguesas" },
    { id: 202, tenant_id: 2, nombre: "McPollo", precio: "180.00", descripcion: "Hamburguesas - Pollo empanizado y mayonesa.", categoria: "Hamburguesas" },
    { id: 203, tenant_id: 2, nombre: "Papas Fritas Medianas", precio: "110.00", descripcion: "Complementos - Las clásicas papas.", categoria: "Complementos" },
    { id: 204, tenant_id: 2, nombre: "McFlurry Oreo", precio: "165.00", descripcion: "Postres - Helado de vainilla con trozos de Oreo.", categoria: "Postres" },
    { id: 205, tenant_id: 2, nombre: "Cuarto de Libra con Queso", precio: "290.00", descripcion: "Hamburguesas - Carne 100% vacuna con queso.", categoria: "Hamburguesas" },

    // KFC
    { id: 301, tenant_id: 3, nombre: "Combo 3 Piezas", precio: "350.00", descripcion: "Pollo - 3 piezas de pollo crujiente con papas.", categoria: "Pollo" },
    { id: 302, tenant_id: 3, nombre: "Popcorn Chicken", precio: "220.00", descripcion: "Pollo - Bocados de pollo.", categoria: "Pollo" },

    // Burger King
    { id: 401, tenant_id: 4, nombre: "Whopper", precio: "310.00", descripcion: "Hamburguesas - A la parrilla con todo.", categoria: "Hamburguesas" },

    // Pizza (Little Caesars / Dominos / Pizza Hut / Pizzarelli)
    { id: 501, tenant_id: 5, nombre: "Pizza Pepperoni Hot-N-Ready", precio: "500.00", descripcion: "Pizza - Lista para llevar.", categoria: "Pizza" },
    { id: 601, tenant_id: 6, nombre: "Pizza Jamón y Queso Mediana", precio: "650.00", descripcion: "Pizza - Masa tradicional.", categoria: "Pizza" },
    { id: 701, tenant_id: 7, nombre: "Pan Pizza Super Supreme", precio: "850.00", descripcion: "Pizza - La favorita con todo.", categoria: "Pizza" },
    { id: 1001, tenant_id: 10, nombre: "Pizza Sabrosa", precio: "700.00", descripcion: "Pizza - Especialidad de la casa.", categoria: "Pizza" },

    // Tacos
    { id: 1201, tenant_id: 12, nombre: "Crunchy Taco", precio: "120.00", descripcion: "Tacos - Taco crujiente de carne.", categoria: "Tacos" },
    { id: 1202, tenant_id: 12, nombre: "Burrito Supreme", precio: "250.00", descripcion: "Tacos - Burrito con todo.", categoria: "Tacos" },

    // Criolla
    { id: 901, tenant_id: 9, nombre: "Hot Dog Especial", precio: "150.00", descripcion: "Criolla - Con todo lo que lleva.", categoria: "Criolla" },
    { id: 1101, tenant_id: 11, nombre: "Sandwich Completo", precio: "275.00", descripcion: "Criolla - Pierna, queso, vegetales.", categoria: "Criolla" },
    { id: 1102, tenant_id: 11, nombre: "Batida de Lechoza", precio: "125.00", descripcion: "Bebidas - Batida natural.", categoria: "Bebidas" },

    // Asian
    { id: 1501, tenant_id: 15, nombre: "Orange Chicken Bowl", precio: "420.00", descripcion: "Asiática - Pollo a la naranja con arroz.", categoria: "Asiática" },

    // Others
    { id: 801, tenant_id: 8, nombre: "Docena Glaseada", precio: "600.00", descripcion: "Postres - 12 donas originales.", categoria: "Postres" },
    { id: 1301, tenant_id: 13, nombre: "Barquilla Danesa", precio: "180.00", descripcion: "Postres - Helado con frutas.", categoria: "Postres" },
    { id: 1401, tenant_id: 14, nombre: "Baby Back Ribs", precio: "950.00", descripcion: "Americana - Costillas con salsa BBQ.", categoria: "General" }
];

export const mockUsers = [
    {
        id: 1,
        nombre: "Rardiel Ceballo",
        correo: "test@foodrush.com",
        contrasena: "123456",
        telefono: "809-555-0101",
        direccion: "Av. Estrella Sadhalá, Santiago",
        zona: "gurabo"
    }
];

export const mockOrders = [];
