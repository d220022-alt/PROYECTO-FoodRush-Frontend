/*
  Guia rápida para presentar:
  Resuelve imágenes de productos y evita placeholders rotos en produccion.
  Buscar en VS Code: imágenes productos, fallback, CDN, placeholders, franquicias.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
/**
 * Mapeo de imágenes de productos para todas las franquicias.
 * Usa Unsplash para imágenes de alta calidad, libres y confiables.
 */

const PRODUCT_IMAGES = {
    // ═══ STARBUCKS ═══
    "Caramel Macchiato": "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80",
    "Café Americano": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    "Cappuccino": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80",
    "Latte Vainilla": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",
    "Iced Coffee": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
    "Cold Brew": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    "Mocha Frappuccino": "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80",
    "Java Chip Frappuccino": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    "Strawberry Frappuccino": "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=600&q=80",
    "Chocolate Caliente": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80",
    "Croissant de Jamón y Queso": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=600&q=80",
    "Muffin de Chocolate": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80",
    "Cheesecake": "https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=600&q=80",
    "Cheesecake New York": "https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=600&q=80",
    "Bagel con Queso Crema": "https://images.unsplash.com/photo-1585445490387-f47934b73b54?auto=format&fit=crop&w=600&q=80",
    "Wrap de Pollo": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80",
    "Starbucks House Blend": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80",
    "Pike Place Roast": "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&w=600&q=80",
    "Veranda Blend": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80",

    // ═══ McDONALD'S ═══
    "Big Mac": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "Cuarto de Libra con Queso": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "McPollo": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    "McLobster": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    "Combo Big Mac": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80",
    "Combo McPollo": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    "Big Mac Doble": "https://images.unsplash.com/photo-1551615593-ef5fe247e8f7?auto=format&fit=crop&w=600&q=80",
    "McNifica": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80",
    "Papas Fritas Medianas": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    "McNuggets 10pc": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
    "Cajita Feliz": "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=600&q=80",
    "Coca-Cola Grande": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
    "Sprite Grande": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&q=80",
    "Malteada de Chocolate": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    "McFlurry Oreo": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
    "McFlurry M&M": "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=600&q=80",
    "Hotcakes": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80",
    "Pie de Manzana": "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=600&q=80",

    // ═══ KFC ═══
    "Bucket 8 Piezas": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
    "Bucket 12 Piezas": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
    "Popcorn Chicken": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
    "Combo Crunch": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
    "Combo Familiar": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
    "Papas Fritas Grandes": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    "Ensalada Coleslaw": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
    "Limonada KFC": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=600&q=80",

    // ═══ BURGER KING ═══
    "Whopper": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80",
    "Whopper con Queso": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "Double Whopper": "https://images.unsplash.com/photo-1551615593-ef5fe247e8f7?auto=format&fit=crop&w=600&q=80",
    "Combo Whopper": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80",
    "Chicken Fries": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
    "Sundae de Chocolate": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",

    // ═══ LITTLE CAESARS ═══
    "Hot-N-Ready Pepperoni": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80",
    "ExtraMostBestest": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
    "3 Meat Treat": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    "Italian Cheese Bread": "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=600&q=80",
    "Crazy Bread": "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=600&q=80",
    "Pepsi 2L": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=600&q=80",

    // ═══ DOMINO'S PIZZA ═══
    "Pepperoni Clásica": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80",
    "Hawaiana": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    "MeatZZa": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    "ExtravaganZZa": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
    "Cheesy Bread": "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=600&q=80",
    "Lava Cake": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
    "Coca-Cola 2L": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",

    // ═══ PIZZA HUT ═══
    "Supreme Pan Pizza": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
    "Meat Lovers Pan": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    "Margarita Delgada": "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=600&q=80",
    "Pasta Alfredo": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80",
    "Breadsticks": "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=600&q=80",

    // ═══ KRISPY KREME ═══
    "Original Glazed": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80",
    "Chocolate Iced Glazed": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    "Strawberry Iced": "https://images.unsplash.com/photo-1533910534207-90f31029a78e?auto=format&fit=crop&w=600&q=80",
    "Oreo Cookies & Kreme": "https://images.unsplash.com/photo-1527904324834-3bda86da6771?auto=format&fit=crop&w=600&q=80",
    "Docena Original Glazed": "https://images.unsplash.com/photo-1506224772180-d75b3efbe9be?auto=format&fit=crop&w=600&q=80",
    "Docena Surtida": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80",
    "Café Latte": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",

    // ═══ RICO HOT DOG ═══
    "Hot Dog Clásico": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "Hot Dog Especial": "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=600&q=80",
    "Super Hot Dog": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "Hamburguesa Rico": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "Papas Fritas": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    "Jugo Natural": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80",

    // ═══ PIZZARELLI ═══
    "Pizza Margherita": "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=600&q=80",
    "Pizza Quattro Formaggi": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
    "Calzone Napolitano": "https://images.unsplash.com/photo-1536964549204-cce9eab227bd?auto=format&fit=crop&w=600&q=80",
    "Penne Arrabbiata": "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=600&q=80",
    "Ensalada Caesar": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",

    // ═══ BARRA PAYÁN ═══
    "Chimi Clásico": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "Chimi Doble": "https://images.unsplash.com/photo-1551615593-ef5fe247e8f7?auto=format&fit=crop&w=600&q=80",
    "Yaroa de Pollo": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
    "Yaroa Mixta": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
    "Plátano Frito": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
    "Morir Soñando": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80",

    // ═══ TACO BELL ═══
    "Crunchy Taco": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80",
    "Taco Supreme": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80",
    "Burrito Supreme": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80",
    "Crunchwrap Supreme": "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=600&q=80",
    "Combo Taco Party": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80",
    "Baja Blast": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&q=80",

    // ═══ HELADOS BON ═══
    "Helado de Vainilla 2 bolas": "https://images.unsplash.com/photo-1570197571499-166b36435e9f?auto=format&fit=crop&w=600&q=80",
    "Helado de Chocolate 2 bolas": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
    "Cookies & Cream": "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=600&q=80",
    "Helado de Cookies & Cream": "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=600&q=80",
    "Batido de Fresa": "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=600&q=80",
    "Banana Split": "https://images.unsplash.com/photo-1570197571499-166b36435e9f?auto=format&fit=crop&w=600&q=80",
    "Brownie con Helado": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",

    // ═══ CHILI'S ═══
    "Baby Back Ribs Full": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    "Baby Back Ribs Half": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    "Oldtimer Burger": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80",
    "Quesadilla de Pollo": "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80",
    "Fajitas de Res": "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80",
    "Southwestern Eggrolls": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
    "Molten Chocolate Cake": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",

    // ═══ PANDA EXPRESS ═══
    "Orange Chicken": "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80",
    "Beijing Beef": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
    "Broccoli Beef": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
    "Kung Pao Chicken": "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80",
    "Chow Mein": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80",
    "Fried Rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
    "Cream Cheese Rangoon": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
    "Té Verde": "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80",
};

// Fallback por categoría si no hay match exacto por nombre
const CATEGORY_FALLBACK_IMAGES = {
    "bebidas": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",
    "hamburguesas": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "pizzas": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
    "postres": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
    "pollo": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
    "combos": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80",
    "complementos": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    "comida": "https://images.unsplash.com/photo-1555507036-ab1f4038024a?auto=format&fit=crop&w=600&q=80",
    "café en casa": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80",
    "donas": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80",
    "hot dogs": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "tacos": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80",
    "burritos": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80",
    "helados": "https://images.unsplash.com/photo-1570197571499-166b36435e9f?auto=format&fit=crop&w=600&q=80",
    "costillas": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    "entradas": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
    "pastas": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80",
    "ensaladas": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
    "batidos": "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=600&q=80",
    "sundaes": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
    "whoppers": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80",
    "platos principales": "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80",
    "aperitivos": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
    "tex-mex": "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80",
    "calzones": "https://images.unsplash.com/photo-1536964549204-cce9eab227bd?auto=format&fit=crop&w=600&q=80",
    "especiales": "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80",
    "picaderas": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
    "docenas": "https://images.unsplash.com/photo-1506224772180-d75b3efbe9be?auto=format&fit=crop&w=600&q=80",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";
const BLOCKED_IMAGE_PATTERNS = [
    /via\.placeholder\.com/i,
    /placeholder/i,
    /placehold\.co/i,
    /dummyimage/i,
    /example\.com/i,
    /Big_Mac_hamburger/i,
    /1585325701165/i,
    /1548365328/i,
    /1612392166886/i,
    /1534312954071/i,
    /1612392062126/i,
    /1611699346793/i,
    /1576107025878/i,
    /1521389508051/i,
    /1571115177098/i,
];

const normalizeKey = (value = '') =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const getCategoryFallbackImage = (category = '') => {
    const normalizedCategory = normalizeKey(category);
    const matchedKey = Object.keys(CATEGORY_FALLBACK_IMAGES).find(
        (key) => normalizeKey(key) === normalizedCategory,
    );

    return matchedKey ? CATEGORY_FALLBACK_IMAGES[matchedKey] : null;
};

export function isUsableProductImageUrl(value = '') {
    const url = String(value || '').trim();
    if (!url) return false;
    if (BLOCKED_IMAGE_PATTERNS.some((pattern) => pattern.test(url))) return false;
    return /^(https?:)?\/\//i.test(url) || url.startsWith('/') || url.startsWith('data:image/');
}

/**
 * Obtiene la URL de imagen para un producto.
 * Prioridad: nombre exacto → fallback por categoría → imagen por defecto
 * @param {string} productName - Nombre del producto
 * @param {string} category - Categoría del producto (opcional)
 * @returns {string} URL de la imagen
 */
export function getProductImage(productName, category = '') {
    // 1. Match exacto por nombre
    if (PRODUCT_IMAGES[productName]) {
        return PRODUCT_IMAGES[productName];
    }

    // 2. Fallback por categoría
    const categoryFallback = getCategoryFallbackImage(category);
    if (categoryFallback) return categoryFallback;

    // 3. Default
    return DEFAULT_IMAGE;
}

export function resolveProductImage(sourceUrl, productName, category = '') {
    if (PRODUCT_IMAGES[productName]) {
        return PRODUCT_IMAGES[productName];
    }

    if (isUsableProductImageUrl(sourceUrl)) {
        return String(sourceUrl).trim();
    }

    return getProductImage(productName, category);
}
