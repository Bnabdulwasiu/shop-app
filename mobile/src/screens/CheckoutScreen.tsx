import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { placeOrder } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
export function CheckoutScreen({ onDone }: { onDone: (orderNumber?: string) => void }) {
  const { accessToken, user } = useAuth();
  const { items, clear, refresh } = useCart();
  const [name, setName] = useState(""); const [email, setEmail] = useState(user?.email ?? "");
  const [address, setAddress] = useState(""); const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit() {
    setError(null); setBusy(true);
    try {
      const res = await placeOrder(accessToken, {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        customer: { full_name: name, email, shipping_address: address, city: city || undefined, country: "Nigeria" },
      });
      if (!res.ok) { setError([res.error, ...(res.details ?? [])].filter(Boolean).join("\n")); return; }
      clear(); await refresh(); onDone(res.orderNumber);
    } catch (e) { setError(e instanceof Error ? e.message : "Checkout failed"); }
    finally { setBusy(false); }
  }
  return (
    <ScrollView style={s.wrap} contentContainerStyle={s.inner}>
      <Text style={s.title}>Checkout</Text>
      <Text style={s.sub}>Same endpoint as the website (POST /api/checkout).</Text>
      <TextInput style={s.input} placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Delivery address" value={address} onChangeText={setAddress} />
      <TextInput style={s.input} placeholder="City" value={city} onChangeText={setCity} />
      <TouchableOpacity style={s.btn} onPress={() => void submit()} disabled={busy || items.length === 0}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Place order ({items.length} lines)</Text>}
      </TouchableOpacity>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f6f4ef" },
  inner: { padding: 16 },
  title: { fontSize: 26, fontWeight: "800", color: "#17171a" },
  sub: { fontSize: 12, color: "#888", marginBottom: 12 },
  input: { backgroundColor: "#fff", borderRadius: 14, padding: 14, fontSize: 14, marginBottom: 10 },
  btn: { backgroundColor: "#17171a", borderRadius: 999, paddingVertical: 15, alignItems: "center", marginTop: 6 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  error: { marginTop: 12, backgroundColor: "#fde8e8", borderRadius: 12, padding: 12, fontSize: 12, color: "#7a1f1f" },
});
