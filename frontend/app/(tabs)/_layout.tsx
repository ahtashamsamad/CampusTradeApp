import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { colors } = useTheme();
  const { totalUnreadCount } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          position: 'absolute',
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'sans-serif-medium',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="favorite" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <View style={{
              marginTop: -20,
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: colors.primary,
              justifyContent: 'center', alignItems: 'center',
              borderWidth: 4, borderColor: colors.background,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
            }}>
              <MaterialIcons size={32} name="add" color="white" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <MaterialIcons size={24} name="chat" color={color} />
              {totalUnreadCount > 0 && (
                <View style={{
                  position: 'absolute', top: -6, right: -12,
                  minWidth: 18, height: 18, borderRadius: 9,
                  backgroundColor: '#ef4444', 
                  borderWidth: 1.5, borderColor: colors.tabBarBg,
                  alignItems: 'center', justifyContent: 'center',
                  paddingHorizontal: 3,
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', lineHeight: 12 }}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="person" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
    </Tabs>
  );
}
