import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { isConfigured } from "../lib/types";

export function LoginScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);

  async function handleEmail() {
    if (!email.trim() || !password) return;
    setBusy(true);
    try {
      if (mode === "in") await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.title}>Chemzo Plaza</Text>
        <Text style={styles.subtitle}>
          Log in with the same account you use on the website — your cart syncs instantly.
        </Text>

        {!isConfigured ? (
          <Text style={styles.error}>
            Missing Supabase keys. Copy mobile/.env.example to mobile/.env and restart Expo.
          </Text>
        ) : null}

        <TouchableOpacity style={styles.googleBtn} onPress={() => void signInWithGoogle()}>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.divider}>or use email (same Supabase account)</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.emailBtn} onPress={() => void handleEmail()} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.emailBtnText}>{mode === "in" ? "Log in" : "Create account"}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode(mode === "in" ? "up" : "in")}>
          <Text style={styles.switch}>
            {mode === "in" ? "New here? Create account" : "Have an account? Log in"}
          </Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f6f4ef", padding: 16, justifyContent: "center" },
  card: { backgroundColor: "#fff", borderRadius: 28, padding: 24 },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#f5d76e",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 20, fontWeight: "800", color: "#17171a" },
  title: { marginTop: 16, fontSize: 28, fontWeight: "800", color: "#17171a" },
  subtitle: { marginTop: 8, fontSize: 13, color: "#666", lineHeight: 19 },
  googleBtn: {
    marginTop: 20,
    backgroundColor: "#17171a",
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
  },
  googleBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  divider: { marginTop: 16, textAlign: "center", fontSize: 12, color: "#888" },
  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e5e1d8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#faf9f6",
  },
  emailBtn: {
    marginTop: 12,
    backgroundColor: "#3a7d44",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  emailBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  switch: { marginTop: 12, textAlign: "center", fontSize: 13, color: "#3a7d44", fontWeight: "700" },
  error: {
    marginTop: 14,
    backgroundColor: "#fde8e8",
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    color: "#7a1f1f",
  },
});
