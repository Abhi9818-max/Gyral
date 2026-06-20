import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@life_events_cache';

export function HomeScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadCachedEvents();
    fetchEvents();
  }, []);

  async function loadCachedEvents() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setEvents(JSON.parse(cached));
        setLoading(false); // Stop loading immediately if we have cache
      }
    } catch (e) {
      console.error('Failed to load cache', e);
    }
  }

  async function fetchEvents() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('life_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });

      if (error) {
        throw error;
      } else {
        setEvents(data || []);
        setIsOffline(false);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data || []));
      }
    } catch (error) {
      console.log('Fetch failed, likely offline:', error);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDate}>{new Date(item.event_date).toLocaleDateString()}</Text>
      <View style={[styles.badge, item.is_achievement ? styles.badgeAchievement : styles.badgeGoal]}>
        <Text style={styles.badgeText}>{item.is_achievement ? 'Achievement' : 'Goal'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          {isOffline && (
            <View style={styles.offlineIndicator}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>Offline Mode (Cached)</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No events found. Start building your legacy on the web app!</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginRight: 6,
  },
  offlineText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  signOutButton: {
    padding: 8,
  },
  signOutText: {
    color: '#ff4444',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeGoal: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  badgeAchievement: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
