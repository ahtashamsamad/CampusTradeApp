import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar,
    ScrollView, TextInput, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/src/utils/format';

type PaymentMethod = {
    id: string; type: 'card' | 'bank' | 'paypal' | 'venmo';
    last4?: string; name: string; isPrimary: boolean; icon: string; color: string;
};

const INITIAL_METHODS: PaymentMethod[] = [
    { id: '1', type: 'card', last4: '4242', name: 'Visa •••• 4242', isPrimary: true, icon: 'credit-card', color: '#60a5fa' },
    { id: '2', type: 'paypal', name: 'PayPal — alex@university.edu', isPrimary: false, icon: 'account-balance-wallet', color: '#fbbf24' },
];

export default function PaymentPayoutsScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [methods, setMethods] = useState<PaymentMethod[]>(INITIAL_METHODS);
    const [showAddCard, setShowAddCard] = useState(false);
    const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [earnings] = useState({ available: 8500, pending: 1500, lifetime: 22000 });

    const setPrimary = (id: string) =>
        setMethods(prev => prev.map(m => ({ ...m, isPrimary: m.id === id })));

    const removeMethod = (id: string) => {
        Alert.alert('Remove Payment Method', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => setMethods(prev => prev.filter(m => m.id !== id)) },
        ]);
    };

    const formatCardNumber = (text: string) => {
        const clean = text.replace(/\D/g, '').slice(0, 16);
        return clean.replace(/(.{4})/g, '$1 ').trim();
    };
    const formatExpiry = (text: string) => {
        const clean = text.replace(/\D/g, '').slice(0, 4);
        return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
    };

    const handleAddCard = () => {
        if (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) {
            Alert.alert('Incomplete', 'Please fill in all card details.');
            return;
        }
        const last4 = cardForm.number.replace(/\s/g, '').slice(-4);
        const newCard: PaymentMethod = {
            id: Date.now().toString(), type: 'card',
            last4, name: `Visa •••• ${last4}`, isPrimary: false,
            icon: 'credit-card', color: '#60a5fa',
        };
        setMethods(prev => [...prev, newCard]);
        setCardForm({ number: '', expiry: '', cvv: '', name: '' });
        setShowAddCard(false);
        Alert.alert('✅ Card Added', `Your card ending in ${last4} has been added.`);
    };

    const handleWithdraw = () => {
        if (earnings.available < 500) {
            Alert.alert('Minimum Withdrawal', 'A minimum of Rs 500 is required to withdraw.');
            return;
        }
        Alert.alert('✅ Withdrawal Initiated', `${formatCurrency(earnings.available)} will be transferred to your primary account within 2–3 business days.`);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, flex: 1 }}>Payment & Payouts</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }}>

                {/* Earnings Summary */}
                <View style={{ margin: 16, backgroundColor: colors.primary, borderRadius: 18, padding: 20, overflow: 'hidden' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>AVAILABLE BALANCE</Text>
                    <Text style={{ color: 'white', fontSize: 38, fontWeight: '800', marginBottom: 4 }}>
                        {formatCurrency(earnings.available)}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 20, marginTop: 8 }}>
                        <View>
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Pending</Text>
                            <Text style={{ color: 'white', fontWeight: '700' }}>{formatCurrency(earnings.pending)}</Text>
                        </View>
                        <View>
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Lifetime Earnings</Text>
                            <Text style={{ color: 'white', fontWeight: '700' }}>{formatCurrency(earnings.lifetime)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={handleWithdraw}
                        style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                    >
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>💸 Withdraw Funds</Text>
                    </TouchableOpacity>
                </View>

                {/* Payment Methods */}
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
                    Payment Methods
                </Text>

                <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 12 }}>
                    {methods.map((m, idx) => (
                        <View key={m.id}
                            style={{ padding: 14, borderBottomWidth: idx < methods.length - 1 ? 1 : 0, borderBottomColor: colors.border + '60', flexDirection: 'row', alignItems: 'center' }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: m.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                <MaterialIcons name={m.icon as any} size={22} color={m.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{m.name}</Text>
                                {m.isPrimary && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
                                        <Text style={{ fontSize: 11, color: '#22c55e', fontWeight: '600' }}>Primary</Text>
                                    </View>
                                )}
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {!m.isPrimary && (
                                    <TouchableOpacity onPress={() => setPrimary(m.id)}
                                        style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.primary }}
                                    >
                                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Set Primary</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => removeMethod(m.id)} style={{ padding: 8 }}>
                                    <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {/* Add Card Toggle */}
                    <TouchableOpacity
                        onPress={() => setShowAddCard(!showAddCard)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: 1, borderTopColor: colors.border + '60' }}
                    >
                        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="add" size={24} color={colors.primary} />
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>Add Payment Method</Text>
                    </TouchableOpacity>
                </View>

                {/* Add Card Form */}
                {showAddCard && (
                    <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.primary + '60', padding: 16, marginBottom: 12 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>Add New Card</Text>
                        {[
                            { key: 'name', label: 'Cardholder Name', placeholder: 'Alex Student', keyboard: 'default' as const },
                            { key: 'number', label: 'Card Number', placeholder: '1234 5678 9012 3456', keyboard: 'numeric' as const },
                        ].map(({ key, label, placeholder, keyboard }) => (
                            <View key={key} style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
                                <TextInput
                                    style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 8, fontSize: 14, color: colors.textPrimary }}
                                    placeholder={placeholder}
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType={keyboard}
                                    value={cardForm[key as keyof typeof cardForm]}
                                    onChangeText={t => setCardForm(p => ({ ...p, [key]: key === 'number' ? formatCardNumber(t) : t }))}
                                />
                            </View>
                        ))}
                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                            {[{ key: 'expiry', label: 'Expiry (MM/YY)', placeholder: '12/26' }, { key: 'cvv', label: 'CVV', placeholder: '•••' }].map(({ key, label, placeholder }) => (
                                <View key={key} style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
                                    <TextInput
                                        style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 8, fontSize: 14, color: colors.textPrimary }}
                                        placeholder={placeholder}
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                        secureTextEntry={key === 'cvv'}
                                        maxLength={key === 'cvv' ? 3 : 5}
                                        value={cardForm[key as keyof typeof cardForm]}
                                        onChangeText={t => setCardForm(p => ({ ...p, [key]: key === 'expiry' ? formatExpiry(t) : t }))}
                                    />
                                </View>
                            ))}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity onPress={() => setShowAddCard(false)} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddCard} style={{ flex: 1.5, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary }}>
                                <Text style={{ color: 'white', fontWeight: '700' }}>Add Card</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Transaction History */}
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 }}>
                    Recent Transactions
                </Text>
                <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                    {[
                        { label: 'Chemistry 101 Textbook sold', amount: `+Rs 1,500`, date: 'Mar 1, 2026', color: '#22c55e' },
                        { label: 'TI-84 Calculator sold', amount: `+Rs 2,400`, date: 'Feb 24, 2026', color: '#22c55e' },
                        { label: 'Withdrawal to Bank account', amount: `-Rs 5,000`, date: 'Feb 20, 2026', color: '#f87171' },
                    ].map((tx, i, arr) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border + '60' }}>
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{tx.label}</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{tx.date}</Text>
                            </View>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: tx.color }}>{tx.amount}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
