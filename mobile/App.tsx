import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CartProvider, useCart } from "./src/context/CartContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ShopScreen } from "./src/screens/ShopScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { OrdersScreen } from "./src/screens/OrdersScreen";

type Tab = "shop" | "cart" | "orders" | "checkout";

function Shell() {
  const { user, ready, signOut } = useAuth();
  const { count } = useCart();
  const [tab, setTab] = useState<Tab>("shop");
  const [lastOrder, setLastOrder] = useState<string | null>(null);

  if (!ready) {
    return (
      <View style={s.center}>
        <Text style={s.muted}>Starting Chemzo Plaza…</Text>
      </View>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <SafeAreaView style={s.wrap}>
      <View style={s.header}>
        <Text style={s.brand}>Chemzo Plaza</Text>
        <Text style={s.email} numberOfLines={1}>
          {user.email}
        </Text>
        <TouchableOpacity onPress={() => void signOut()}>
          <Text style={s.logout}>Log out</Text>
        </TouchableOpacity>
      </View>

      {lastOrder ? (
        <View style={s.orderBanner}>
          <Text style={s.orderText}>Order {lastOrder} placed ✓</Text>
          <TouchableOpacity onPress={() => setLastOrder(null)}>
            <Text style={s.orderDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={s.body}>
        {tab === "shop" && <ShopScreen onOpenCart={() => setTab("cart")} />}
        {tab === "cart" && (
          <CartScreen
            onCheckout={() => setTab("checkout")}
          />
        )}
        {tab === "checkout" && (
          <CheckoutScreen
            onDone={(num) => {
              setLastOrder(num ?? "placed");
              setTab("orders");
            }}
          />
        )}
        {tab === "orders" && <OrdersScreen />}
      </View>

      <View style={s.tabs}>
        {(["shop", "cart", "orders"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tab, tab === t && s.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === "shop" ? "Shop" : t === "cart" ? `Cart (${count})` : "Orders"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Shell />
      </CartProvider>
    </AuthProvider>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f6f4ef" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#888", fontSize: 13 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  brand: { fontSize: 16, fontWeight: "800", color: "#17171a" },
  email: { flex: 1, fontSize: 11, color: "#888" },
  logout: { fontSize: 12, fontWeight: "800", color: "#a33" },
  orderBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#e9f3ea",
    margin: 12,
    marginBottom: 0,
    borderRadius: 14,
    padding: 12,
  },
  orderText: { fontSize: 12, fontWeight: "800", color: "#2c5f33" },
  orderDismiss: { fontSize: 12, fontWeight: "700", color: "#2c5f33" },
  body: { flex: 1 },
  tabs: { flexDirection: "row", backgroundColor: "#fff", padding: 10, gap: 8 },
  tab: { flex: 1, borderRadius: 999, paddingVertical: 12, alignItems: "center", backgroundColor: "#f1eee6" },
  tabActive: { backgroundColor: "#17171a" },
  tabText: { fontSize: 13, fontWeight: "800", color: "#17171a" },
  tabTextActive: { color: "#fff" },
});
