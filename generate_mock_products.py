# Guia rapida para presentar:
# Script auxiliar del frontend. Sirve para generar o ajustar archivos durante desarrollo, no para la app en produccion.
# Mantener estos comentarios actualizados si cambia el flujo.
import json
import unicodedata

TOTAL_PER_FRANCHISE = 20


def normalize(value: str) -> str:
    return (
        unicodedata.normalize("NFD", str(value or ""))
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
        .strip()
    )


def get_category_key(category: str) -> str:
    key = normalize(category)
    aliases = {
        "acompanante": "acompanantes",
        "acompanantes": "acompanantes",
        "complemento": "acompanantes",
        "complementos": "acompanantes",
        "hotdog": "hot dogs",
        "hot dogs": "hot dogs",
        "hotdogs": "hot dogs",
        "cafe en casa": "cafe en casa",
        "cafe": "bebidas",
        "te": "bebidas",
    }
    return aliases.get(key, key)


franchises = [
    {"tenantId": 1, "name": "Starbucks", "slug": "starbucks", "categories": ["Bebidas", "Comida", "Cafe en Casa"]},
    {"tenantId": 2, "name": "McDonald's", "slug": "mcdonalds", "categories": ["Hamburguesas", "Complementos", "Bebidas", "Postres"]},
    {"tenantId": 3, "name": "KFC", "slug": "kfc", "categories": ["Pollo", "Combos", "Acompanantes", "Bebidas"]},
    {"tenantId": 4, "name": "Burger King", "slug": "burger-king", "categories": ["Hamburguesas", "Combos", "Acompanantes", "Bebidas"]},
    {"tenantId": 5, "name": "Little Caesars", "slug": "little-caesars", "categories": ["Pizzas", "Combos", "Acompanantes", "Bebidas"]},
    {"tenantId": 6, "name": "Domino's Pizza", "slug": "dominos-pizza", "categories": ["Pizzas", "Combos", "Acompanantes", "Bebidas"]},
    {"tenantId": 7, "name": "Pizza Hut", "slug": "pizza-hut", "categories": ["Pizzas", "Pastas", "Acompanantes", "Bebidas"]},
    {"tenantId": 8, "name": "Krispy Kreme", "slug": "krispy-kreme", "categories": ["Donas", "Bebidas", "Combos", "Postres"]},
    {"tenantId": 9, "name": "Rico Hot Dog", "slug": "rico-hot-dog", "categories": ["Hot Dogs", "Combos", "Acompanantes", "Bebidas"]},
    {"tenantId": 10, "name": "Pizzarelli", "slug": "pizzarelli", "categories": ["Pizzas", "Pastas", "Acompanantes", "Bebidas"]},
    {"tenantId": 11, "name": "Barra Payan", "slug": "barra-payan", "categories": ["Hamburguesas", "Chimi", "Acompanantes", "Bebidas"]},
    {"tenantId": 12, "name": "Taco Bell", "slug": "taco-bell", "categories": ["Tacos", "Burritos", "Nachos", "Bebidas"]},
    {"tenantId": 13, "name": "Helados Bon", "slug": "helados-bon", "categories": ["Helados", "Postres", "Combos", "Bebidas"]},
    {"tenantId": 14, "name": "Chili's", "slug": "chilis", "categories": ["Platos", "Combos", "Acompanantes", "Bebidas"]},
    {"tenantId": 15, "name": "Panda Express", "slug": "panda-express", "categories": ["Pollo", "Res", "Acompanantes", "Bebidas"]},
]

adjectives = [
    "Clasico",
    "Supremo",
    "Doble",
    "Premium",
    "Picante",
    "Familiar",
    "Especial",
    "Crujiente",
    "Gourmet",
]

category_nouns = {
    "hamburguesas": ["Burger", "Doble", "Cheese", "Bacon", "Melt", "Classic", "Stack"],
    "pizzas": ["Pepperoni", "Margarita", "Hawaiana", "Cuatro Quesos", "BBQ", "Vegetariana", "Napolitana"],
    "bebidas": ["Refresco", "Limonada", "Cafe", "Te Helado", "Frappe", "Malteada", "Smoothie", "Agua Fresca"],
    "postres": ["Sundae", "Brownie", "Pay", "Galleta", "Cheesecake", "Helado", "Tarta"],
    "pollo": ["Piezas", "Tenders", "Alitas", "Nuggets", "Bucket", "Sandwich de Pollo", "Crujiente"],
    "tacos": ["Taco Clasico", "Taco Dorado", "Taco Soft", "Taco Supreme", "Taco Callejero"],
    "burritos": ["Burrito Clasico", "Burrito XL", "Burrito Supreme", "Burrito Veggie", "Burrito Crunch"],
    "nachos": ["Nachos Clasicos", "Nachos Supreme", "Nachos con Queso", "Nachos Picantes", "Nachos BBQ"],
    "acompanantes": ["Papas", "Aros de Cebolla", "Ensalada", "Pure", "Coleslaw", "Nachos", "Papas con Queso"],
    "combos": ["Combo", "Duo", "Trio", "Familiar", "Supremo", "Especial"],
    "pastas": ["Spaghetti", "Lasagna", "Fettuccine", "Penne", "Ravioli"],
    "helados": ["Cono", "Sundae", "Banana Split", "Copa", "Malteada Helada"],
    "donas": ["Dona Glaseada", "Dona Chocolate", "Dona Rellena", "Dona Caramelo", "Dona Frutal"],
    "hot dogs": ["Hot Dog Clasico", "Hot Dog Jumbo", "Hot Dog con Queso", "Hot Dog Bacon", "Hot Dog Especial"],
    "chimi": ["Chimi Clasico", "Chimi Doble", "Chimi Bacon", "Chimi Pollo", "Chimi Supremo"],
    "platos": ["Parrillada", "Costillas", "Fajitas", "Bowl Tex-Mex", "Plato Especial"],
    "res": ["Res Salteada", "Res Teriyaki", "Res con Brocoli", "Res Picante", "Res Especial"],
    "cafe en casa": ["Cafe Molido", "Cafe en Grano", "Capsulas", "Blend", "Kit Barista", "Prensa Francesa", "Filtro"],
    "comida": ["Sandwich", "Panini", "Wrap", "Croissant", "Bagel", "Ensalada", "Muffin"],
}

category_types = {
    "hamburguesas": ["Res", "Pollo", "Pescado", "Cerdo"],
    "pizzas": ["Clasica", "Pepperoni", "Hawaiana", "Vegetariana"],
    "bebidas": ["Frio", "Caliente"],
    "postres": ["Helado", "Pastel", "Galleta"],
    "pollo": ["Crispy", "Original", "Spicy"],
    "acompanantes": ["Papas", "Ensalada", "Snacks"],
    "combos": ["Individual", "Duo", "Familiar"],
    "pastas": ["Spaghetti", "Lasagna", "Alfredo"],
    "helados": ["Cono", "Sundae", "Banana Split"],
    "donas": ["Glaseada", "Chocolate", "Rellena"],
    "hot dogs": ["Clasico", "Queso", "Bacon"],
    "tacos": ["Res", "Pollo", "Veggie"],
    "burritos": ["Res", "Pollo", "Veggie"],
    "nachos": ["Queso", "Carne", "Supreme"],
    "chimi": ["Clasico", "Doble", "Pollo"],
    "platos": ["Parrilla", "Tex-Mex", "Bowl"],
    "res": ["Salteado", "Teriyaki", "Picante"],
    "cafe en casa": ["Molido", "Grano", "Capsulas"],
    "comida": ["Sandwich", "Wrap", "Panini"],
}

category_prices = {
    "hamburguesas": [180, 220, 260, 300, 340],
    "pizzas": [250, 300, 350, 400, 450],
    "bebidas": [80, 100, 120, 150, 180],
    "postres": [100, 140, 180, 220, 260],
    "pollo": [190, 230, 270, 320, 360],
    "acompanantes": [90, 120, 150, 170, 190],
    "combos": [200, 250, 300, 350, 400],
    "pastas": [210, 250, 290, 330, 370],
    "helados": [120, 150, 180, 210, 240],
    "donas": [80, 90, 110, 130, 150],
    "hot dogs": [120, 150, 180, 210, 240],
    "tacos": [110, 140, 170, 200, 230],
    "burritos": [130, 160, 190, 220, 250],
    "nachos": [120, 150, 180, 210, 240],
    "chimi": [170, 200, 230, 260, 300],
    "platos": [250, 300, 350, 400, 450],
    "res": [220, 260, 300, 340, 380],
    "cafe en casa": [120, 150, 180, 210, 240],
    "comida": [140, 170, 200, 230, 260],
}

category_images = {
    "hamburguesas": [
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
        "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=80",
        "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80",
    ],
    "pizzas": [
        "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80",
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80",
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80",
    ],
    "bebidas": [
        "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&q=80",
        "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80",
        "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80",
    ],
    "postres": [
        "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80",
        "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80",
        "https://images.unsplash.com/photo-1571115177098-24deab4843ed?w=500&q=80",
    ],
    "pollo": [
        "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500&q=80",
        "https://images.unsplash.com/photo-1585325701165-351af045e581?w=500&q=80",
    ],
    "tacos": [
        "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&q=80",
        "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80",
    ],
    "acompanantes": [
        "https://images.unsplash.com/photo-1576107025878-4cd382211993?w=500&q=80",
        "https://images.unsplash.com/photo-1623595119708-26b1f7300075?w=500&q=80",
    ],
    "pastas": [
        "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&q=80",
        "https://images.unsplash.com/photo-1521389508051-d7ffb5dc8b78?w=500&q=80",
    ],
    "hot dogs": [
        "https://images.unsplash.com/photo-1612392166886-ee8475b03f6c?w=500&q=80",
        "https://images.unsplash.com/photo-1534312954071-88812fca3c40?w=500&q=80",
    ],
    "helados": [
        "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80",
        "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=500&q=80",
    ],
    "donas": [
        "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&q=80",
        "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=500&q=80",
    ],
    "combos": [
        "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80",
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
    ],
    "chimi": [
        "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=80",
        "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80",
    ],
    "platos": [
        "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80",
    ],
    "res": [
        "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=80",
        "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80",
    ],
    "cafe en casa": [
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80",
    ],
    "comida": [
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80",
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&q=80",
    ],
    "burritos": [
        "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80",
        "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&q=80",
    ],
    "nachos": [
        "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=500&q=80",
        "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80",
    ],
}


def get_img(category_key: str, index: int) -> str:
    images = category_images.get(category_key) or [
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80"
    ]
    return images[index % len(images)]


def build_name(category_key: str, index: int, category_index: int, used_names: set) -> str:
    nouns = category_nouns.get(category_key, ["Plato", "Combo", "Porcion", "Especial"])
    noun = nouns[index % len(nouns)]
    adj = adjectives[(index + category_index) % len(adjectives)]
    name = f"{noun} {adj}"
    if name in used_names:
        name = f"{name} {index + 1}"
    used_names.add(name)
    return name


def build_type(category_key: str, index: int) -> str:
    types = category_types.get(category_key, ["Clasico"])
    return types[index % len(types)]


def build_price(category_key: str, index: int, category_index: int) -> int:
    prices = category_prices.get(category_key, [150, 190, 250, 300, 350])
    return prices[(index + category_index) % len(prices)]


def is_extra_feature(name: str) -> bool:
    keywords = ["picante", "supremo", "premium", "doble", "especial", "gourmet"]
    normalized = normalize(name)
    return any(keyword in normalized for keyword in keywords)


mock_products = []

for franchise in franchises:
    categories = franchise["categories"]
    base_count = TOTAL_PER_FRANCHISE // len(categories)
    remainder = TOTAL_PER_FRANCHISE % len(categories)
    product_index = 1
    used_names_by_category = {}

    for cat_index, category in enumerate(categories):
        count = base_count + (1 if cat_index < remainder else 0)
        category_key = get_category_key(category)
        used_names = used_names_by_category.setdefault(category_key, set())

        for i in range(count):
            name = build_name(category_key, i, cat_index, used_names)
            mock_products.append(
                {
                    "id": f"prod_{franchise['tenantId']}_{product_index}",
                    "tenantId": franchise["tenantId"],
                    "franchiseSlug": franchise["slug"],
                    "name": name,
                    "category": category,
                    "type": build_type(category_key, i),
                    "price": build_price(category_key, i, cat_index),
                    "description": f"Delicioso producto de la categoria {category} en {franchise['name']}.",
                    "img": get_img(category_key, i),
                    "isExtraFeature": is_extra_feature(name),
                }
            )
            product_index += 1


javascript_content = f"export const mockProducts = {json.dumps(mock_products, indent=2)};\n"

with open("src/data/mockProducts.js", "w", encoding="utf-8") as f:
    f.write(javascript_content)

print("Generated src/data/mockProducts.js with balanced products.")
