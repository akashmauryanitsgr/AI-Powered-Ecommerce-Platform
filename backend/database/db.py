import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.getenv("DATABASE_URL", "shopmind.db")


def get_connection():
    """Get a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dicts
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def create_tables():
    """Create all tables if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            icon TEXT,
            image_url TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            original_price REAL,
            category_id INTEGER,
            image_url TEXT,
            rating REAL DEFAULT 4.0,
            review_count INTEGER DEFAULT 0,
            stock INTEGER DEFAULT 100,
            brand TEXT,
            tags TEXT,
            is_featured INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            session_id TEXT,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            session_id TEXT,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            shipping_address TEXT,
            payment_method TEXT,
            items TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS wishlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            session_id TEXT,
            product_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
    """)

    conn.commit()
    conn.close()
    print("✅ Tables created")


def seed_data():
    """Seed categories and products if empty."""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM categories")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    categories = [
        ("Electronics", "electronics", "Gadgets, devices and tech accessories", "💻", "/images/categories/electronics.jpg"),
        ("Fashion", "fashion", "Clothing, apparel and style essentials", "👗", "/images/categories/fashion.jpg"),
        ("Footwear", "footwear", "Shoes, sneakers and sandals for all", "👟", "/images/categories/footwear.jpg"),
        ("Beauty", "beauty", "Skincare, makeup and grooming products", "✨", "/images/categories/beauty.jpg"),
        ("Home Decor", "home-decor", "Furniture, lighting and interior accents", "🏠", "/images/categories/home-decor.jpg"),
        ("Groceries", "groceries", "Fresh produce, pantry staples and more", "🛒", "/images/categories/groceries.jpg"),
        ("Accessories", "accessories", "Bags, jewelry and lifestyle accessories", "💍", "/images/categories/accessories.jpg"),
        ("Fitness", "fitness", "Equipment, apparel and wellness products", "🏋️", "/images/categories/fitness.jpg"),
        ("Books", "books", "Bestsellers, textbooks and literary gems", "📚", "/images/categories/books.jpg"),
    ]

    cursor.executemany(
        "INSERT INTO categories (name, slug, description, icon, image_url) VALUES (?, ?, ?, ?, ?)",
        categories
    )

    # Get category IDs
    cursor.execute("SELECT id, slug FROM categories")
    cat_map = {row["slug"]: row["id"] for row in cursor.fetchall()}

    products = [
        # ── Electronics (10) ──────────────────────────────────────────────
        ("AirWave Pro Wireless Earbuds",       "Premium noise-cancelling earbuds with 30hr battery life and spatial audio. Crystal clear sound with deep bass.",                          3499,  4999, cat_map["electronics"], "/images/products/earbuds.jpg",        4.7, 2341,  50, "AirWave",    "earbuds,wireless,audio",              1),
        ("SlimBook Ultra Laptop 14\"",          "Ultra-thin 14-inch laptop with Intel Core i7, 16GB RAM, 512GB SSD and brilliant OLED display.",                                          72999, 84999, cat_map["electronics"], "/images/products/laptop.jpg",         4.5,  876,  30, "SlimBook",   "laptop,computer,portable",            1),
        ("NovaCam 4K Mirrorless Camera",        "Professional mirrorless camera with 24.2MP sensor, 4K video, and 5-axis image stabilization.",                                           58999, 69999, cat_map["electronics"], "/images/products/camera.jpg",         4.6,  543,  20, "NovaCam",    "camera,photography,4k",               0),
        ("ZenWatch Series 8 Smartwatch",        "Health-focused smartwatch with ECG, SpO2, GPS and 18-day battery life. Swim-proof design.",                                              18999, 24999, cat_map["electronics"], "/images/products/smartwatch.jpg",     4.4, 3102,  80, "ZenWatch",   "smartwatch,wearable,fitness",         1),
        ("SoundBar Pro 2.1 Home Theater",       "Powerful 120W soundbar with Dolby Atmos, wireless subwoofer and HDMI ARC support.",                                                      12999, 17999, cat_map["electronics"], "/images/products/soundbar.jpg",       4.3,  421,  45, "SoundBar",   "audio,home,entertainment",            0),
        ("TabMax Pro 11\" Tablet",              "High-performance tablet with 11-inch 120Hz display, M2 chip and stylus support.",                                                         44999, 52999, cat_map["electronics"], "/images/products/tablet.jpg",         4.5,  987,  35, "TabMax",     "tablet,portable,productivity",        0),
        ("PixelDesk 27\" 4K Monitor",           "27-inch 4K IPS monitor with 144Hz refresh rate, HDR400 and USB-C 90W charging. Ultra-thin bezels.",                                     32999, 41999, cat_map["electronics"], "/images/products/monitor.jpg",        4.6,  654,  25, "PixelDesk",  "monitor,display,4k",                  0),
        ("SwiftCharge 65W GaN Charger",         "Compact 65W GaN charger with 3 ports. Charges laptop, phone and tablet simultaneously. Foldable plug.",                                  2499,  3499, cat_map["electronics"], "/images/products/charger.jpg",        4.5, 1876, 150, "SwiftCharge","charger,gan,fast-charging",           0),
        ("MechKey Pro Wireless Keyboard",       "Compact 75% mechanical keyboard with hot-swappable switches, RGB backlight and 3-device Bluetooth.",                                      7999, 10999, cat_map["electronics"], "/images/products/keyboard.jpg",       4.7,  432,  60, "MechKey",    "keyboard,mechanical,wireless",        1),
        ("BassHead Over-Ear Headphones",        "Studio-grade over-ear headphones with 40mm drivers, active noise cancellation and 50hr battery.",                                         5999,  8499, cat_map["electronics"], "/images/products/headphones.jpg",     4.6, 1234,  70, "BassHead",   "headphones,audio,noise-cancelling",   0),

        # ── Fashion (10) ──────────────────────────────────────────────────
        ("Luxe Linen Blazer",                  "Breathable pure linen blazer with a relaxed modern cut. Perfect for work and weekend wear.",                                               4999,  7999, cat_map["fashion"],      "/images/products/blazer.jpg",         4.6,  654,  60, "Luxe",       "blazer,linen,formal",                 1),
        ("Classic Oxford Button-Down",          "Timeless 100% cotton Oxford shirt in premium weave. Versatile and wrinkle-resistant.",                                                    1899,  2999, cat_map["fashion"],      "/images/products/shirt.jpg",          4.4, 1203, 120, "ClassicWear","shirt,formal,cotton",                 0),
        ("Slim Fit Chino Trousers",             "Modern slim-fit chinos in stretch cotton blend for all-day comfort and style.",                                                            2499,  3499, cat_map["fashion"],      "/images/products/chinos.jpg",         4.3,  892,  90, "ClassicWear","chinos,trousers,casual",               0),
        ("Merino Wool Turtleneck",              "Soft Italian merino wool turtleneck. Naturally temperature-regulating and odour-resistant.",                                               3799,  5499, cat_map["fashion"],      "/images/products/turtleneck.jpg",     4.7,  432,  50, "Luxe",       "wool,knitwear,winter",                1),
        ("Relaxed Fit Denim Jacket",            "Vintage-washed denim jacket with relaxed fit. A wardrobe essential for every season.",                                                    2999,  4499, cat_map["fashion"],      "/images/products/denim-jacket.jpg",   4.4,  677,  70, "DenimCo",    "denim,jacket,casual",                 0),
        ("Premium Polo T-Shirt",                "Pique cotton polo with ribbed collar and cuffs. Slim fit. Available in 8 classic colours.",                                               1299,  1799, cat_map["fashion"],      "/images/products/polo.jpg",           4.3, 2109, 200, "ClassicWear","polo,tshirt,casual",                  0),
        ("Formal Suit Set 2-Piece",             "Italian wool-blend 2-piece suit with notch lapel. Slim fit. Ideal for office and events.",                                               14999, 21999, cat_map["fashion"],      "/images/products/suit.jpg",           4.6,  321,  30, "Luxe",       "suit,formal,wedding",                 1),
        ("Printed Kurta Set",                   "Hand block-printed cotton kurta with matching pyjama. Comfortable ethnic wear for all occasions.",                                        1799,  2799, cat_map["fashion"],      "/images/products/kurta.jpg",          4.5,  987,  85, "IndieWeave", "kurta,ethnic,cotton",                 0),
        ("Jogger Sweatpants",                   "Fleece-lined jogger pants with elastic waist and tapered fit. Perfect for lounge and light workouts.",                                    1499,  2199, cat_map["fashion"],      "/images/products/joggers.jpg",        4.4, 1543, 110, "UrbanFit",   "joggers,casual,comfortable",          0),
        ("Lightweight Windbreaker",             "Water-resistant windbreaker with zip pockets and packable hood. Perfect for travel and outdoors.",                                         3499,  4999, cat_map["fashion"],      "/images/products/windbreaker.jpg",    4.5,  765,  55, "TrailWear",  "jacket,windbreaker,outdoor",          0),

        # ── Footwear (10) ─────────────────────────────────────────────────
        ("Stride Runner X Pro Sneakers",        "Lightweight performance sneakers with cloud-foam midsole and breathable mesh upper.",                                                      4999,  6999, cat_map["footwear"],     "/images/products/sneakers.jpg",       4.8, 4321, 100, "Stride",     "sneakers,running,sports",             1),
        ("Heritage Leather Derby Shoes",        "Hand-crafted full-grain leather derby shoes with Goodyear welt construction.",                                                             8999, 12999, cat_map["footwear"],     "/images/products/derby-shoes.jpg",    4.6,  321,  40, "Heritage",   "formal,leather,shoes",                1),
        ("CloudWalk Comfort Loafers",           "Memory foam insole loafers in premium suede. Slip-on convenience with elegant finish.",                                                    3499,  5499, cat_map["footwear"],     "/images/products/loafers.jpg",        4.5,  876,  65, "CloudWalk",  "loafers,casual,comfort",              0),
        ("Trek Master Hiking Boots",            "Waterproof hiking boots with Vibram outsole, ankle support and Gore-Tex lining.",                                                          6999,  9999, cat_map["footwear"],     "/images/products/hiking-boots.jpg",   4.7,  543,  55, "TrekMaster", "hiking,boots,outdoor",                0),
        ("Breeze Sandals Summer Edition",       "Handcrafted leather sandals with anatomical footbed and adjustable buckle straps.",                                                        1999,  2999, cat_map["footwear"],     "/images/products/sandals.jpg",        4.2, 1102,  80, "Breeze",     "sandals,summer,casual",               0),
        ("Canvas Slip-On Espadrilles",          "Lightweight cotton canvas espadrilles with jute rope sole. Effortless summer style.",                                                      1299,  1899, cat_map["footwear"],     "/images/products/espadrilles.jpg",    4.3,  654,  90, "Breeze",     "espadrilles,canvas,summer",           0),
        ("Chelsea Ankle Boots",                 "Genuine leather Chelsea boots with elastic side panels and stacked heel. Classic silhouette.",                                             7499, 10999, cat_map["footwear"],     "/images/products/chelsea-boots.jpg",  4.6,  432,  35, "Heritage",   "boots,chelsea,leather",               1),
        ("FlexSport Cross Trainer",             "Versatile cross-training shoes with multi-directional outsole and cushioned insole.",                                                       3999,  5499, cat_map["footwear"],     "/images/products/cross-trainer.jpg",  4.4,  876,  75, "Stride",     "shoes,training,gym",                  0),
        ("Moccasin House Slippers",             "Genuine sheepskin moccasin slippers with memory foam insole. Warm and cosy all day.",                                                      2499,  3499, cat_map["footwear"],     "/images/products/slippers.jpg",       4.5, 1234,  95, "CloudWalk",  "slippers,home,comfort",               0),
        ("Kids Velcro Sneakers",                "Lightweight kids sneakers with easy velcro closure, cushioned sole and anti-slip grip.",                                                   1499,  2199, cat_map["footwear"],     "/images/products/kids-sneakers.jpg",  4.4,  987,  85, "Stride",     "kids,sneakers,velcro",                0),

        # ── Beauty (10) ───────────────────────────────────────────────────
        ("Glow Serum Vitamin C 30ml",           "Brightening vitamin C serum with 20% L-ascorbic acid. Reduces dark spots and boosts radiance.",                                           1899,  2999, cat_map["beauty"],       "/images/products/serum.jpg",          4.7, 3421, 200, "GlowLab",    "serum,skincare,vitamin-c",            1),
        ("HydraLux Moisturizer SPF50",          "Daily moisturizer with SPF50, hyaluronic acid and niacinamide. Non-greasy formula.",                                                      1499,  2199, cat_map["beauty"],       "/images/products/moisturizer.jpg",    4.5, 2103, 180, "HydraLux",   "moisturizer,spf,skincare",            1),
        ("Rose Clay Detox Face Mask",           "Purifying face mask with rose clay, kaolin and tea tree. Deep cleans pores in 10 minutes.",                                                999,  1499, cat_map["beauty"],       "/images/products/face-mask.jpg",      4.4, 1654, 150, "PureSkin",   "mask,clay,detox",                     0),
        ("Velvet Matte Lip Collection",         "Long-wear matte lipstick set of 6 shades. Hydrating formula with vitamin E. 12-hour wear.",                                               1299,  1799, cat_map["beauty"],       "/images/products/lipstick.jpg",       4.6,  987, 120, "VelvetGlow", "lipstick,makeup,matte",               0),
        ("Argan Hair Oil Treatment",            "Moroccan argan oil treatment that repairs damage, reduces frizz and adds brilliant shine.",                                                  899,  1399, cat_map["beauty"],       "/images/products/hair-oil.jpg",       4.5, 2341, 160, "ArganPure",  "hair,oil,treatment",                  0),
        ("Retinol Night Cream 50ml",            "Advanced retinol night cream with peptides and ceramides. Reduces fine lines overnight.",                                                  2299,  3499, cat_map["beauty"],       "/images/products/night-cream.jpg",    4.6,  876, 130, "GlowLab",    "retinol,night-cream,anti-aging",      1),
        ("Micellar Cleansing Water 400ml",      "Gentle micellar water that removes makeup, dirt and impurities without rinsing. Suitable for all skin types.",                              699,   999, cat_map["beauty"],       "/images/products/micellar-water.jpg", 4.4, 3210, 250, "PureSkin",   "cleanser,micellar,makeup-remover",    0),
        ("Eyeshadow Palette 18 Shades",         "Versatile palette with 18 shades from nude to smoky. Highly pigmented. Long-lasting formula.",                                            1599,  2299, cat_map["beauty"],       "/images/products/eyeshadow.jpg",      4.5, 1432, 110, "VelvetGlow", "eyeshadow,makeup,palette",            0),
        ("Beard Grooming Kit",                  "Complete beard kit: oil, balm, wooden comb and boar bristle brush. Nourishes and styles beard.",                                          1299,  1999, cat_map["beauty"],       "/images/products/beard-kit.jpg",      4.6,  654,  90, "GroomCo",    "beard,grooming,men",                  0),
        ("Sunscreen SPF70 PA++++ 60ml",         "Lightweight sunscreen with SPF70 PA++++. No white cast, water-resistant formula for daily use.",                                            899,  1299, cat_map["beauty"],       "/images/products/sunscreen.jpg",      4.7, 2876, 200, "HydraLux",   "sunscreen,spf,skincare",              0),

        # ── Home Decor (10) ───────────────────────────────────────────────
        ("Scandinavian Floor Lamp",             "Minimalist floor lamp with linen shade and solid oak base. Warm 3000K ambient light.",                                                     6999,  9999, cat_map["home-decor"],   "/images/products/floor-lamp.jpg",     4.6,  432,  30, "NordHome",   "lamp,lighting,minimal",               1),
        ("Handwoven Jute Area Rug 5x7",         "Natural jute area rug with geometric pattern. Eco-friendly and durable for high-traffic areas.",                                           4999,  7499, cat_map["home-decor"],   "/images/products/rug.jpg",            4.4,  654,  25, "EcoWeave",   "rug,jute,natural",                    0),
        ("Ceramic Planter Set (3pcs)",          "Set of 3 matte ceramic planters in graduated sizes. Minimalist design with drainage holes.",                                               1799,  2799, cat_map["home-decor"],   "/images/products/planters.jpg",       4.5,  876,  60, "TerraForm",  "planter,ceramic,plants",              1),
        ("Wall Art Canvas Triptych",            "Abstract expressionist canvas set of 3. Gallery-wrapped, ready to hang. 60x80cm each.",                                                    3499,  5999, cat_map["home-decor"],   "/images/products/wall-art.jpg",       4.3,  321,  20, "ArtHaus",    "art,canvas,wall",                     0),
        ("Premium Scented Candle Set",          "Luxury soy wax candle collection: Sandalwood, Amber and White Tea. 45-hour burn each.",                                                    2499,  3499, cat_map["home-decor"],   "/images/products/candles.jpg",        4.7, 1543,  90, "LuxeScent",  "candles,fragrance,luxury",            1),
        ("Macrame Wall Hanging",                "Handmade boho macrame wall hanging in natural cotton rope. Adds texture and warmth to any wall.",                                          1499,  2199, cat_map["home-decor"],   "/images/products/macrame.jpg",        4.4,  543,  45, "BohoDecor",  "macrame,wall,boho",                   0),
        ("Wooden Serving Tray with Handles",    "Solid acacia wood serving tray with cut-out handles. Ideal for breakfast in bed or bar setup.",                                            1999,  2999, cat_map["home-decor"],   "/images/products/tray.jpg",           4.5,  765,  55, "NordHome",   "tray,wood,kitchen",                   0),
        ("Linen Throw Blanket",                 "Soft washed linen throw blanket. Breathable, lightweight and perfect for layering on sofa.",                                               3299,  4999, cat_map["home-decor"],   "/images/products/throw-blanket.jpg",  4.6,  432,  40, "NordHome",   "blanket,linen,bedroom",               0),
        ("Geometric Brass Clock",               "Silent sweep wall clock with geometric brass frame. 30cm diameter. Battery operated.",                                                     2799,  3999, cat_map["home-decor"],   "/images/products/wall-clock.jpg",     4.3,  321,  35, "ArtHaus",    "clock,brass,wall",                    0),
        ("Bamboo Bathroom Organiser Set",       "Set of 5 bamboo organiser containers for bathroom countertop. Eco-friendly and stylish.",                                                  1299,  1899, cat_map["home-decor"],   "/images/products/organiser.jpg",      4.4,  654,  70, "EcoWeave",   "bamboo,bathroom,organiser",           0),

        # ── Groceries (10) ────────────────────────────────────────────────
        ("Organic Quinoa 1kg",                  "Premium organic white quinoa. Complete protein source with all essential amino acids.",                                                      599,   799, cat_map["groceries"],    "/images/products/quinoa.jpg",         4.5, 2341, 300, "OrganicFarm","quinoa,grain,organic",                0),
        ("Cold Press Olive Oil 500ml",          "Extra virgin olive oil cold-pressed from hand-picked Mediterranean olives. 0.2% acidity.",                                                  899,  1299, cat_map["groceries"],    "/images/products/olive-oil.jpg",      4.7, 1876, 200, "MediTerra",  "olive-oil,cooking,mediterranean",     1),
        ("Raw Honey Wildflower 400g",           "Pure wildflower raw honey. Unpasteurized to preserve natural enzymes and antioxidants.",                                                     699,   999, cat_map["groceries"],    "/images/products/honey.jpg",          4.6, 3210, 250, "HiveNature", "honey,raw,natural",                   0),
        ("Mixed Nuts Premium Pack 500g",        "Premium blend of cashews, almonds, walnuts and pistachios. Lightly salted. No fillers.",                                                   1199,  1699, cat_map["groceries"],    "/images/products/nuts.jpg",           4.4, 2109, 180, "NutHaven",   "nuts,snack,protein",                  0),
        ("Matcha Green Tea Powder 100g",        "Ceremonial grade Japanese matcha from Uji, Kyoto. Vibrant green, smooth umami flavor.",                                                    1499,  2199, cat_map["groceries"],    "/images/products/matcha.jpg",         4.8, 1432, 120, "KyotoTea",   "matcha,tea,japanese",                 1),
        ("Himalayan Pink Salt 1kg",             "Pure unrefined Himalayan pink rock salt rich in 84 trace minerals. For cooking and seasoning.",                                              299,   449, cat_map["groceries"],    "/images/products/pink-salt.jpg",      4.5, 3456, 400, "OrganicFarm","salt,himalayan,mineral",               0),
        ("Chia Seeds Organic 500g",             "Raw organic chia seeds packed with omega-3, fibre and protein. Great for smoothies and pudding.",                                            549,   799, cat_map["groceries"],    "/images/products/chia-seeds.jpg",     4.6, 2109, 320, "OrganicFarm","chia,seeds,superfood",                0),
        ("Apple Cider Vinegar 500ml",           "Raw unfiltered apple cider vinegar with the mother. Supports digestion and immunity.",                                                       399,   599, cat_map["groceries"],    "/images/products/acv.jpg",            4.5, 1876, 280, "HiveNature", "vinegar,apple-cider,health",          0),
        ("Dark Chocolate 85% Cacao 100g",       "Single origin 85% dark chocolate bar. Rich in antioxidants, low sugar, vegan-friendly.",                                                    299,   449, cat_map["groceries"],    "/images/products/dark-chocolate.jpg", 4.7, 4321, 350, "ChocoNoir",  "chocolate,dark,cacao",                1),
        ("Coconut Oil Cold Pressed 500ml",      "100% pure cold pressed virgin coconut oil. Multi-use: cooking, hair and skin care.",                                                         699,   999, cat_map["groceries"],    "/images/products/coconut-oil.jpg",    4.6, 2543, 220, "OrganicFarm","coconut-oil,cooking,organic",         0),

        # ── Accessories (10) ──────────────────────────────────────────────
        ("Italian Leather Wallet - Slim",       "Minimalist bifold wallet in genuine Italian calfskin leather. RFID blocking. Fits 8 cards.",                                               2499,  3999, cat_map["accessories"],  "/images/products/wallet.jpg",         4.7, 2341,  80, "LeatherCraft","wallet,leather,minimal",              1),
        ("Stainless Steel Watch Strap",         "Brushed stainless steel mesh watch strap. Universal 20mm fit. Quick-release spring bars.",                                                  1299,  1999, cat_map["accessories"],  "/images/products/watch-strap.jpg",    4.4,  654, 100, "StrapCo",    "watch,strap,steel",                   0),
        ("Canvas Tote Bag - Natural",           "Heavy-duty 12oz canvas tote with reinforced handles. Interior zipper pocket. 15L capacity.",                                                 999,  1499, cat_map["accessories"],  "/images/products/tote-bag.jpg",       4.5, 1876, 120, "CanvasCo",   "tote,bag,eco",                        0),
        ("Pearl Stud Earrings Set",             "Freshwater pearl studs in sterling silver settings. Classic 7mm size. Hypoallergenic.",                                                    1799,  2799, cat_map["accessories"],  "/images/products/earrings.jpg",       4.6,  987,  60, "PearlLux",   "earrings,pearl,jewelry",              1),
        ("Aviator Sunglasses Polarized",        "Classic aviator sunglasses with UV400 polarized lenses and gold-tone metal frame.",                                                         3299,  4999, cat_map["accessories"],  "/images/products/sunglasses.jpg",     4.5, 1432,  70, "SunStyle",   "sunglasses,polarized,fashion",        0),
        ("Leather Passport Holder",             "Full-grain leather passport holder with card slots, pen loop and RFID protection. Travel essential.",                                       1499,  2299, cat_map["accessories"],  "/images/products/passport-holder.jpg",4.6,  876,  85, "LeatherCraft","passport,travel,leather",             0),
        ("Silk Pocket Square Set (3pcs)",       "Set of 3 pure silk pocket squares in classic patterns. Elevates any formal outfit instantly.",                                               999,  1499, cat_map["accessories"],  "/images/products/pocket-square.jpg",  4.4,  543,  95, "Luxe",       "pocket-square,silk,formal",           0),
        ("Beaded Bracelet Stack Set",           "Set of 5 handmade natural stone beaded bracelets. Lapis, tiger eye, onyx and more.",                                                       1199,  1799, cat_map["accessories"],  "/images/products/bracelet.jpg",       4.5, 1234,  80, "PearlLux",   "bracelet,beaded,jewelry",             0),
        ("Minimalist Silver Necklace",          "Delicate sterling silver chain necklace with geometric pendant. Hypoallergenic. Gift-boxed.",                                              1999,  2999, cat_map["accessories"],  "/images/products/necklace.jpg",       4.7,  765,  60, "PearlLux",   "necklace,silver,jewelry",             1),
        ("Crossbody Sling Bag",                 "Compact vegan leather crossbody bag with adjustable strap and zip pockets. Fits phone and essentials.",                                    2299,  3299, cat_map["accessories"],  "/images/products/sling-bag.jpg",      4.4,  987,  75, "CanvasCo",   "bag,crossbody,sling",                 0),

        # ── Fitness (10) ──────────────────────────────────────────────────
        ("PowerGrip Resistance Bands Set",      "Set of 5 latex resistance bands: 5-50kg resistance. Includes carry bag and workout guide.",                                                1499,  2499, cat_map["fitness"],      "/images/products/resistance-bands.jpg",4.6, 3210, 200, "PowerGrip",  "resistance-bands,workout,home-gym",   1),
        ("Premium Yoga Mat 6mm",                "Non-slip natural rubber yoga mat with alignment lines. 6mm cushioning. Eco-friendly.",                                                     2999,  4499, cat_map["fitness"],      "/images/products/yoga-mat.jpg",       4.7, 2543, 100, "ZenFlex",    "yoga,mat,fitness",                    1),
        ("Adjustable Dumbbell 5-25kg",          "Space-saving adjustable dumbbell with quick-select weight dial. Replaces 9 dumbbells.",                                                   12999, 18999, cat_map["fitness"],      "/images/products/dumbbell.jpg",       4.5,  876,  30, "FlexWeight", "dumbbell,weights,gym",                0),
        ("Sports Water Bottle 1L Insulated",    "Double-wall vacuum insulated stainless steel bottle. Keeps drinks cold 24hr, hot 12hr.",                                                   1999,  2999, cat_map["fitness"],      "/images/products/water-bottle.jpg",   4.6, 4321, 150, "HydroFit",   "bottle,hydration,sports",             0),
        ("Wireless Fitness Tracker Band",       "Slim fitness tracker with heart rate, sleep tracking, step counter and 7-day battery.",                                                    3999,  5999, cat_map["fitness"],      "/images/products/fitness-band.jpg",   4.3, 1654,  80, "FitBand",    "fitness,tracker,wearable",            0),
        ("Foam Roller Deep Tissue",             "High-density EVA foam roller for myofascial release and muscle recovery. 45cm length.",                                                    1299,  1999, cat_map["fitness"],      "/images/products/foam-roller.jpg",    4.6, 1876, 120, "PowerGrip",  "foam-roller,recovery,massage",        0),
        ("Jump Rope Speed Cable",               "Professional speed jump rope with ball-bearing handles and adjustable steel cable. For HIIT.",                                               699,   999, cat_map["fitness"],      "/images/products/jump-rope.jpg",      4.5, 2341, 180, "PowerGrip",  "jump-rope,cardio,hiit",               0),
        ("Pull-Up Bar Doorframe",               "Heavy-duty doorframe pull-up bar with foam grips. No screws needed. Holds up to 150kg.",                                                   2499,  3499, cat_map["fitness"],      "/images/products/pullup-bar.jpg",     4.4,  987,  65, "FlexWeight", "pullup,bar,home-gym",                 0),
        ("Gym Gloves with Wrist Wrap",          "Anti-slip gym gloves with integrated wrist wrap support. Breathable mesh back. Unisex.",                                                     799,  1199, cat_map["fitness"],      "/images/products/gym-gloves.jpg",     4.5, 1543, 160, "PowerGrip",  "gloves,gym,wrist-support",            0),
        ("Ab Roller Wheel with Knee Pad",       "Pro ab roller with ergonomic handles and extra-wide wheel for stability. Includes knee pad.",                                                899,  1399, cat_map["fitness"],      "/images/products/ab-roller.jpg",      4.3, 1234, 140, "ZenFlex",    "ab-roller,core,abs",                  0),

        # ── Books (10) ────────────────────────────────────────────────────
        ("Atomic Habits - James Clear",         "The #1 New York Times bestseller on building good habits and breaking bad ones. Life-changing.",                                             499,   799, cat_map["books"],        "/images/products/atomic-habits.jpg",  4.9,12543, 500, "Penguin",    "self-help,habits,productivity",       1),
        ("The Design of Everyday Things",       "Donald Norman's classic on user-centered design. Essential reading for designers and engineers.",                                             799,  1199, cat_map["books"],        "/images/products/design-book.jpg",    4.7, 4321, 200, "MIT Press",  "design,ux,engineering",               0),
        ("Deep Work - Cal Newport",             "Rules for focused success in a distracted world. Proven strategies for peak productivity.",                                                   599,   899, cat_map["books"],        "/images/products/deep-work.jpg",      4.6, 6543, 300, "Piatkus",    "productivity,focus,career",           1),
        ("Sapiens: A Brief History",            "Yuval Noah Harari's masterful account of humankind from prehistory to the present day.",                                                     699,   999, cat_map["books"],        "/images/products/sapiens.jpg",        4.8, 9876, 400, "Vintage",    "history,science,philosophy",          1),
        ("Python Crash Course 3rd Ed",          "A hands-on project-based introduction to programming with Python. For absolute beginners.",                                                  899,  1299, cat_map["books"],        "/images/products/python-book.jpg",    4.7, 5432, 250, "No Starch",  "programming,python,tech",             0),
        ("The Psychology of Money",             "Morgan Housel's timeless lessons on wealth, greed and happiness. One of the best finance books ever.",                                       599,   899, cat_map["books"],        "/images/products/psychology-money.jpg",4.8, 8765, 450, "Harriman",   "money,finance,psychology",            1),
        ("Rich Dad Poor Dad",                   "Robert Kiyosaki's classic guide to financial independence. Most popular personal finance book worldwide.",                                    499,   699, cat_map["books"],        "/images/products/rich-dad.jpg",       4.6,11234, 500, "Plata",      "finance,investing,self-help",         0),
        ("The Alchemist - Paulo Coelho",        "A mystical story of Santiago the shepherd boy and his journey to find treasure. International bestseller.",                                  399,   599, cat_map["books"],        "/images/products/alchemist.jpg",      4.7,14321, 600, "HarperCollins","fiction,philosophy,journey",        1),
        ("Zero to One - Peter Thiel",           "Notes on startups and how to build the future. Essential reading for entrepreneurs and innovators.",                                          699,   999, cat_map["books"],        "/images/products/zero-to-one.jpg",    4.6, 5678, 280, "Crown",      "startup,business,entrepreneur",       0),
        ("Ikigai: Japanese Secret",             "The Japanese concept of finding purpose and joy in life. Simple, powerful and beautifully written.",                                         499,   699, cat_map["books"],        "/images/products/ikigai.jpg",         4.7, 7654, 380, "Hutchinson", "ikigai,japanese,purpose,happiness",   0),
    ]

    cursor.executemany(
        """INSERT INTO products 
           (name, description, price, original_price, category_id, image_url, rating, review_count, stock, brand, tags, is_featured) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        products
    )

    conn.commit()
    conn.close()
    print("✅ Sample data seeded")