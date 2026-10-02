import type { Product } from "./types";

/**
 * Fallback catalogue used only when Supabase has not been configured yet (or the
 * `products` table is still empty). Keeping this in sync with `supabase/schema.sql`
 * means product links and images work in both "demo" and "database" modes.
 *
 * Prices are in kobo (NGN × 100). IDs match the seed data in supabase/schema.sql.
 */
export const DEMO_PRODUCTS: Product[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    slug: "indomie-carton-40",
    name: "Indomie Instant Noodles (Carton × 40)",
    description:
      "A full carton of 40 packs of Indomie Instant Noodles — Nigeria's most-loved quick meal. Available in Chicken, Onion Chicken and other classic flavours. Perfect for home, office or resale.",
    price_cents: 850000, // ₦8,500
    currency: "NGN",
    image_url:
      "https://i.etsystatic.com/20760160/r/il/bfd466/3590637582/il_1140xN.3590637582_e3yq.jpg",
    category: "Food & Beverages",
    stock: 80,
    active: true,
  },
  {
    id: "11111111-1111-4111-8111-111111111102",
    slug: "pepsi-60cl-crate-24",
    name: "Pepsi 60cl × 24 Crate",
    description:
      "A chilled crate of 24 Pepsi 60cl bottles — the classic Nigerian party essential. Great for households, events and small businesses. Delivery available within Abuja.",
    price_cents: 600000, // ₦6,000
    currency: "NGN",
    image_url: "https://picsum.photos/seed/pepsi-crate/800/800",
    category: "Food & Beverages",
    stock: 40,
    active: true,
  },
  {
    id: "11111111-1111-4111-8111-111111111103",
    slug: "dettol-soap-6pack",
    name: "Dettol Original Soap (6-pack)",
    description:
      "Six bars of Dettol Original antibacterial soap. Trusted for over 80 years to protect against germs. Each bar 75g. Ideal for family use and everyday hygiene in Nigerian homes.",
    price_cents: 420000, // ₦4,200
    currency: "NGN",
    image_url:
      "https://i.pinimg.com/originals/a8/d4/40/a8d440bfced2e16a1e07806a9fe596c9.jpg",
    category: "Toiletries & Personal Care",
    stock: 60,
    active: true,
  },
  {
    id: "11111111-1111-4111-8111-111111111104",
    slug: "tecno-spark-20",
    name: "Tecno Spark 20",
    description:
      "The Tecno Spark 20 features a 6.56\" HD+ display, 16MP front camera, 5000mAh battery and runs HiOS on Android. Dual SIM, 4G LTE ready — a solid everyday smartphone at an affordable Naira price.",
    price_cents: 18500000, // ₦185,000
    currency: "NGN",
    image_url:
      "https://d2cdo4blch85n8.cloudfront.net/wp-content/uploads/2024/01/TECNO-SPARK-20-Pro-Android-Smartphone-1568x882.jpg",
    category: "Electronics & Accessories",
    stock: 10,
    active: true,
  },
  {
    id: "11111111-1111-4111-8111-111111111105",
    slug: "usb-c-braided-cable-2m",
    name: "USB-C Braided Charging Cable (2m)",
    description:
      "Heavy-duty 2-metre nylon-braided USB-C to USB-A charging cable. Supports fast charging up to 60W. Compatible with Android phones, tablets and laptops. Tangle-free and built to last.",
    price_cents: 250000, // ₦2,500
    currency: "NGN",
    image_url: "https://picsum.photos/seed/usbc-cable/800/800",
    category: "Electronics & Accessories",
    stock: 50,
    active: true,
  },
  {
    id: "11111111-1111-4111-8111-111111111106",
    slug: "pampers-baby-dry-size3",
    name: "Pampers Baby Dry Diapers (Size 3, 48-pack)",
    description:
      "Pampers Baby Dry Size 3 (6–10 kg) in a 48-pack. Up to 12 hours of overnight dryness with 3 layers of absorbency. Soft, stretchy sides for a snug, comfortable fit. A must-have for every Nigerian mum.",
    price_cents: 1250000, // ₦12,500
    currency: "NGN",
    image_url: "https://picsum.photos/seed/pampers-baby-dry/800/800",
    category: "Baby & Kids",
    stock: 25,
    active: true,
  },
];
