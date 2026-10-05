import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { ListRenderItemInfo } from "react-native";
import { fetchProducts } from "../lib/api";
import { formatMoney, type Product } from "../lib/types";
import { useCart } from "../context/CartContext";

export function ShopScreen({ onOpenCart }: { onOpenCart: () => void }) {
  const { addItem, count } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setProducts(await fetchProducts());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load products");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleAdd(product: Product) {
    addItem(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId((cur) => (cur === product.id ? null : cur)), 1200);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading products…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Chemzo Plaza — Now Online</Text>
        <Text style={styles.heroSub}>Same shop, same account, same cart as the website.</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={onOpenCart}>
          <Text style={styles.cartBtnText}>View cart ({count})</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void load()}>
            <Text style={styles.retry}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList<Product>
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        renderItem={({ item }: ListRenderItemInfo<Product>) => (
          <View style={styles.card}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, styles.imageFallback]} />
            )}
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.price}>{formatMoney(item.price_cents, item.currency)}</Text>
            <Text style={styles.stock}>{item.stock > 0 ? `${item.stock} in stock` : "Sold out"}</Text>
            <TouchableOpacity
              style={[styles.addBtn, item.stock <= 0 && styles.addBtnDisabled]}
              disabled={item.stock <= 0}
              onPress={() => handleAdd(item)}
            >
              <Text style={styles.addBtnText}>
                {addedId === item.id ? "Added ✓" : "Add to cart"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f6f4ef" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  muted: { color: "#888", fontSize: 13 },
  hero: { backgroundColor: "#fff", margin: 12, borderRadius: 24, padding: 18 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#17171a" },
  heroSub: { marginTop: 4, fontSize: 12, color: "#666" },
  cartBtn: { marginTop: 12, backgroundColor: "#17171a", borderRadius: 999, paddingVertical: 12, alignItems: "center" },
  cartBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  errorBox: { marginHorizontal: 12, backgroundColor: "#fde8e8", borderRadius: 14, padding: 12 },
  errorText: { fontSize: 12, color: "#7a1f1f" },
  retry: { marginTop: 6, fontSize: 12, fontWeight: "800", color: "#7a1f1f" },
  list: { padding: 12 },
  row: { gap: 12 },
  card: { flex: 1, backgroundColor: "#fff", borderRadius: 20, padding: 10, marginBottom: 12 },
  image: { width: "100%", height: 120, borderRadius: 14, backgroundColor: "#eee" },
  imageFallback: { backgroundColor: "#e7e2d5" },
  name: { marginTop: 8, fontSize: 13, fontWeight: "700", color: "#17171a", minHeight: 32 },
  price: { marginTop: 4, fontSize: 14, fontWeight: "800", color: "#17171a" },
  stock: { marginTop: 2, fontSize: 11, color: "#888" },
  addBtn: { marginTop: 8, backgroundColor: "#f5d76e", borderRadius: 999, paddingVertical: 10, alignItems: "center" },
  addBtnDisabled: { opacity: 0.45 },
  addBtnText: { fontSize: 12, fontWeight: "800", color: "#17171a" },
});
