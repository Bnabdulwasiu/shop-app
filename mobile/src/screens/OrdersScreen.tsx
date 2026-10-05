import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { ListRenderItemInfo } from "react-native";
import { fetchOrders } from "../lib/api";
import { useAuth } from "../context/AuthContext";
type OrderRow = Record<string, unknown>;
export function OrdersScreen() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setOrders(await fetchOrders(accessToken));
    setLoading(false);
  }, [accessToken]);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <View style={s.center}><ActivityIndicator /><Text style={s.muted}>Loading orders…</Text></View>;
  return (
    <View style={s.wrap}>
      <FlatList<OrderRow> data={orders} keyExtractor={(o) => String(o.id ?? Math.random())}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
        ListEmptyComponent={<Text style={s.muted}>No orders yet — check out to create one.</Text>}
        renderItem={({ item }: ListRenderItemInfo<OrderRow>) => (
          <View style={s.card}>
            <Text style={s.num}>{String(item.order_number ?? "Order")}</Text>
            <Text style={s.meta}>{String(item.status ?? "")} • ₦{Math.round(Number(item.total_cents ?? 0) / 100).toLocaleString()}</Text>
          </View>
        )} />
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f6f4ef" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#888", fontSize: 13, textAlign: "center", marginTop: 8 },
  list: { padding: 12 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10 },
  num: { fontSize: 14, fontWeight: "800", color: "#17171a" },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
});
