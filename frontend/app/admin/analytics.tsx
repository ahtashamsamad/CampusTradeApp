import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { db } from "@/src/config/firebase";
import { collection, onSnapshot, query, getDocs } from "firebase/firestore";
import { useTheme } from "@/context/ThemeContext";
import { MaterialIcons } from "@expo/vector-icons";

export default function Analytics() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    userRegistrations: 0,
    activeListings: 0,
    categories: [] as { name: string; value: number }[],
    topUsers: [] as { name: string; listings: number }[],
  });

  const fetchData = async () => {
    try {
      const unsubs: (() => void)[] = [];

      // Users Snapshot
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Listings Snapshot
      const listingsSnap = await getDocs(collection(db, "listings"));
      const listings = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Process Categories
      const catMap: Record<string, number> = {};
      listings.forEach((l: any) => {
        catMap[l.category || "Other"] = (catMap[l.category || "Other"] || 0) + 1;
      });
      const categories = Object.entries(catMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Process Top Users
      const userMap: Record<string, number> = {};
      listings.forEach((l: any) => {
        if (l.sellerId || l.userId) {
          const id = l.sellerId || l.userId;
          userMap[id] = (userMap[id] || 0) + 1;
        }
      });
      
      const nameMap: Record<string, string> = {};
      users.forEach((u: any) => { nameMap[u.id] = u.name || "Unknown"; });
      
      const topUsers = Object.entries(userMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({
          name: nameMap[id] || id.slice(0, 8),
          listings: count
        }));

      setStats({
        userRegistrations: users.length,
        activeListings: listings.length,
        categories,
        topUsers
      });

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Platform Insights</Text>
        
        {/* Summary Cards */}
        <View style={styles.row}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Users</Text>
            <Text style={[styles.cardValue, { color: colors.primary }]}>{stats.userRegistrations}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Listings</Text>
            <Text style={[styles.cardValue, { color: "#22c55e" }]}>{stats.activeListings}</Text>
          </View>
        </View>

        {/* Categories Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Listings by Category</Text>
          {stats.categories.map((cat, i) => (
            <View key={i} style={styles.statRow}>
              <Text style={[styles.statName, { color: colors.textSecondary }]}>{cat.name}</Text>
              <View style={styles.barContainer}>
                <View style={[styles.bar, { width: `${(cat.value / stats.activeListings) * 100}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{cat.value}</Text>
            </View>
          ))}
        </View>

        {/* Top Users Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Most Active Sellers</Text>
          {stats.topUsers.map((user, i) => (
            <View key={i} style={styles.userRow}>
              <View style={[styles.rank, { backgroundColor: colors.primary + '20' }]}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{i + 1}</Text>
              </View>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
              <Text style={[styles.userCount, { color: colors.textSecondary }]}>{user.listings} items</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  row: { flexDirection: "row", gap: 12, marginBottom: 20 },
  card: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  cardLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  cardValue: { fontSize: 24, fontWeight: "800" },
  section: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  statRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  statName: { width: 80, fontSize: 12 },
  barContainer: { flex: 1, height: 8, backgroundColor: "#f1f5f920", borderRadius: 4, overflow: "hidden" },
  bar: { height: "100%", borderRadius: 4 },
  statValue: { width: 30, fontSize: 12, fontWeight: "700", textAlign: "right" },
  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  rank: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  userName: { flex: 1, fontSize: 14, fontWeight: "600" },
  userCount: { fontSize: 13 },
});
