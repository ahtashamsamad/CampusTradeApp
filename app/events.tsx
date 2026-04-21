import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';

export default function EventsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-background-dark">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Sticky Header */}
            <View className="bg-background-dark/95 z-50 pt-2 border-b border-surface-highlight">
                <View className="px-4 py-3 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <TouchableOpacity onPress={() => router.back()} className="p-1">
                            <MaterialIcons name="arrow-back" size={24} color="#f8fafc" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-white">Trade Events</Text>
                    </View>
                    <View className="flex-row gap-2">
                        <TouchableOpacity className="p-2 rounded-full hover:bg-slate-800">
                            <MaterialIcons name="search" size={24} color="#94a3b8" />
                        </TouchableOpacity>
                        <TouchableOpacity className="p-2 rounded-full hover:bg-slate-800">
                            <MaterialIcons name="tune" size={24} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Date Filter Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3" contentContainerStyle={{ paddingRight: 20 }}>
                    <FilterPill title="All Events" isActive={true} />
                    <FilterPill title="This Week" isActive={false} />
                    <FilterPill title="Book Swaps" isActive={false} />
                    <FilterPill title="Electronics" isActive={false} />
                    <FilterPill title="Clothing" isActive={false} />
                </ScrollView>
            </View>

            <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Hero Section: Featured Event */}
                <View className="mb-8">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-lg font-bold text-white">Featured Event</Text>
                        <TouchableOpacity>
                            <Text className="text-sm font-medium text-primary">See details</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="rounded-2xl overflow-hidden bg-surface-dark border border-surface-highlight">
                        <View className="relative w-full h-40 bg-indigo-900/40 items-center justify-center border-b border-surface-highlight">
                            <MaterialIcons name="event" size={64} color="#818cf8" opacity={0.5} />
                            
                            <View className="absolute top-3 left-3 bg-surface-dark/90 rounded-lg px-3 py-1.5 items-center border border-surface-highlight">
                                <Text className="text-xs font-bold text-red-500 uppercase">May</Text>
                                <Text className="text-xl font-bold text-white">12</Text>
                            </View>
                            <View className="absolute top-3 right-3 bg-primary/90 px-2.5 py-1 rounded-full">
                                <Text className="text-white text-xs font-bold">Textbooks</Text>
                            </View>
                        </View>

                        <View className="p-5">
                            <View className="flex-row justify-between items-start gap-4">
                                <View className="flex-1">
                                    <Text className="text-xl font-bold text-white mb-1">Spring Textbook Swap</Text>
                                    <View className="flex-row items-center gap-1 mb-3">
                                        <MaterialIcons name="location-on" size={18} color="#6366f1" />
                                        <Text className="text-sm text-text-secondary">The Quad • 10:00 AM</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row items-center justify-between pt-2 border-t border-surface-highlight mt-2">
                                <View className="flex-row items-center gap-2">
                                    <View className="flex-row -space-x-2">
                                        <View className="w-6 h-6 rounded-full border-2 border-surface-dark bg-indigo-500 items-center justify-center">
                                            <Text className="text-[10px] text-white font-bold">A</Text>
                                        </View>
                                        <View className="w-6 h-6 rounded-full border-2 border-surface-dark bg-teal-500 items-center justify-center">
                                            <Text className="text-[10px] text-white font-bold">M</Text>
                                        </View>
                                    </View>
                                    <Text className="text-xs font-medium text-text-secondary">+245 going</Text>
                                </View>

                                <TouchableOpacity className="bg-green-600/10 border border-green-600/20 px-4 py-2 rounded-lg flex-row items-center justify-center gap-2">
                                    <MaterialIcons name="check-circle" size={18} color="#4ade80" />
                                    <Text className="text-sm font-semibold text-green-400">You are going!</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Upcoming List Section */}
                <View className="mb-8">
                    <Text className="text-lg font-bold text-white mb-4">Upcoming Swap Meets</Text>
                    <View className="gap-4">
                        <EventCard
                            month="Nov" date="15"
                            title="Electronics & Gadget Exchange"
                            time="2:00 PM - 5:00 PM"
                            location="Main Hall Lobby"
                            isPrimaryJoin={true}
                        />
                        <EventCard
                            month="Nov" date="22"
                            title="Dorm Decor Fair"
                            time="11:00 AM - 3:00 PM"
                            location="Student Union"
                            isPrimaryJoin={false}
                        />
                        <EventCard
                            month="Dec" date="10"
                            title="Finals Week Book Buyback"
                            time="9:00 AM - 6:00 PM"
                            location="Library Steps"
                            isPrimaryJoin={false}
                        />
                    </View>
                </View>

                {/* Past Events / Explore More */}
                <View className="pt-4 border-t border-surface-highlight pb-8">
                    <Text className="text-lg font-bold text-white mb-4">Explore Categories</Text>
                    <View className="flex-row gap-3">
                        <CategoryCard
                            title="Books"
                            icon="menu-book"
                            color="#93c5fd"
                            bg="#1e3a5f"
                        />
                        <CategoryCard
                            title="Tech"
                            icon="devices"
                            color="#d8b4fe"
                            bg="#4c1d95"
                        />
                    </View>
                </View>

            </ScrollView>

            {/* Floating Action Button */}
            <View className="absolute bottom-10 right-4 z-40">
                <TouchableOpacity className="bg-primary p-4 rounded-full shadow-lg shadow-primary/30">
                    <MaterialIcons name="add-location-alt" size={28} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function FilterPill({ title, isActive }: { title: string, isActive: boolean }) {
    return (
        <TouchableOpacity className={`mr-2 px-4 py-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-surface-dark border border-surface-highlight'}`}>
            <Text className={`text-sm ${isActive ? 'text-white font-semibold' : 'text-text-secondary font-medium'}`}>{title}</Text>
        </TouchableOpacity>
    );
}

function EventCard({ month, date, title, time, location, isPrimaryJoin }: any) {
    return (
        <TouchableOpacity className="bg-surface-dark rounded-xl p-4 border border-surface-highlight flex-row gap-4 items-start">
            <View className="items-center justify-center w-14 h-16 bg-slate-800/50 rounded-lg border border-slate-700">
                <Text className="text-xs font-semibold text-text-secondary uppercase">{month}</Text>
                <Text className="text-lg font-bold text-white">{date}</Text>
            </View>
            <View className="flex-1 min-w-0">
                <Text className="text-base font-bold text-white truncate" numberOfLines={1}>{title}</Text>
                <Text className="text-sm text-text-secondary mt-0.5"><MaterialIcons name="schedule" size={14} /> {time}</Text>
                <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center gap-1 bg-slate-800 px-2 py-1 rounded-md">
                        <MaterialIcons name="location-on" size={14} color="#94a3b8" />
                        <Text className="text-xs font-medium text-text-secondary">{location}</Text>
                    </View>
                    <TouchableOpacity className={`px-4 py-1.5 rounded-lg ${isPrimaryJoin ? 'bg-primary' : 'bg-slate-700'}`}>
                        <Text className="text-white text-sm font-semibold">Join</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function CategoryCard({ title, icon, color, bg }: any) {
    return (
        <TouchableOpacity 
            className="flex-1 overflow-hidden rounded-xl h-24 items-center justify-center gap-2 border border-surface-highlight"
            style={{ backgroundColor: bg }}
        >
            <MaterialIcons name={icon} size={32} color={color} />
            <Text className="text-white font-bold text-sm">{title}</Text>
        </TouchableOpacity>
    );
}
