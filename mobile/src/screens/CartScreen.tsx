import React, { useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ListRenderItemInfo } from "react-native";
import { useCart } from "../context/CartContext";
import { formatMoney, type CartItem } from "../lib/types";
const SHIP = 150000; const FREE_AT = 5000000;
export function CartScreen({ onCheckout }: { onCheckout: () => void }) {
  const { items, count, subtotalCents, ready, lastSync, setQuantity, removeItem, clear, refresh } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const shipping = subtotalCents <= 0 ? 0 : subtotalCents >= FREE_AT ? 0 : SHIP;
  const currency = items[0]?.currency ?? "NGN";
  async function handleRefresh() { setRefreshing(true); await refresh(); setRefreshing(false); }
  if (!ready) return <View style={s.center}><Text style={s.muted}>Loading your cart…</Text></View>;
  return (
    <View style={s.wrap}>
      <View style={s.syncBar}>
        <Text style={s.syncText}>{lastSync ? `Synced with website • ${lastSync}` : "Live sync on"}</Text>
        <TouchableOpacity onPress={() => void handleRefresh()}><Text style={s.refresh}>Refresh</Text></TouchableOpacity>
      </View>
      {items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.muted}>Add items on the website — they appear here instantly.</Text>
        </View>
      ) : (
        <>
          <FlatList<CartItem> data={items} keyExtractor={(i) => i.productId} contentContainerStyle={s.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            renderItem={({ item }: ListRenderItemInfo<CartItem>) => (
              <View style={s.row}>
                {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={s.thumb} /> : <View style={[s.thumb, s.fb]} />}
                <View style={s.info}>
                  <Text style={s.name} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.unit}>{formatMoney(item.priceCents, item.currency)} each</Text>
                  <View style={s.stepper}>
                    <TouchableOpacity style={s.stepBtn} onPress={() => setQuantity(item.productId, item.quantity - 1)}><Text style={s.stepText}>−</Text></TouchableOpacity>
                    <Text style={s.qty}>{item.quantity}</Text>
                    <TouchableOpacity style={s.stepBtn} onPress={() => setQuantity(item.productId, item.quantity + 1)}><Text style={s.stepText}>+</Text></TouchableOpacity>
                  </View>
                </View>
                <View style={s.right}>
                  <Text style={s.lineTotal}>{formatMoney(item.priceCents * item.quantity, item.currency)}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.productId)}><Text style={s.remove}>Remove</Text></TouchableOpacity>
                </View>
              </View>
            )} />
          <View style={s.summary}>
            <Text style={s.total}>{formatMoney(subtotalCents + shipping, currency)} ({count} items)</Text>
            <Text style={s.sub}>{shipping === 0 ? "Free delivery" : `Incl. ${formatMoney(shipping, currency)} delivery`}</Text>
            <TouchableOpacity style={s.checkoutBtn} onPress={onCheckout}><Text style={s.checkoutText}>Checkout</Text></TouchableOpacity>
            <TouchableOpacity onPress={clear}><Text style={s.clear}>Clear cart</Text></TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f6f4ef" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  muted: { color: "#888", fontSize: 13, textAlign: "center", marginTop: 6 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#17171a" },
  syncBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#e9f3ea", margin: 12, marginBottom: 0, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  syncText: { fontSize: 11, color: "#2c5f33", fontWeight: "700" },
  refresh: { fontSize: 11, fontWeight: "800", color: "#2c5f33" },
  list: { padding: 12 },
  row: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 18, padding: 10, marginBottom: 10, gap: 10 },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: "#eee" },
  fb: { backgroundColor: "#e7e2d5" },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: "700", color: "#17171a" },
  unit: { fontSize: 11, color: "#888", marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#f1eee6", alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 16, fontWeight: "800", color: "#17171a" },
  qty: { fontSize: 14, fontWeight: "800" },
  right: { alignItems: "flex-end", justifyContent: "space-between" },
  lineTotal: { fontSize: 13, fontWeight: "800", color: "#17171a" },
  remove: { fontSize: 11, color: "#a33", fontWeight: "700" },
  summary: { backgroundColor: "#17171a", margin: 12, borderRadius: 24, padding: 18 },
  total: { fontSize: 20, color: "#fff", fontWeight: "800" },
  sub: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  checkoutBtn: { marginTop: 12, backgroundColor: "#fff", borderRadius: 999, paddingVertical: 14, alignItems: "center" },
  checkoutText: { fontWeight: "800", color: "#17171a", fontSize: 14 },
  clear: { marginTop: 10, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.5)" },
});
