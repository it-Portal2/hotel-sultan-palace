import React, { useState, useEffect } from 'react';
import Drawer from '@/components/ui/Drawer';
import { useToast } from '@/context/ToastContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ExchangeRateDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onRatesUpdated: (rates: Record<string, number>) => void;
}

export default function ExchangeRateDrawer({ isOpen, onClose, onRatesUpdated }: ExchangeRateDrawerProps) {
    const { showToast } = useToast();
    const [baseCurrency, setBaseCurrency] = useState('USD');
    const [rates, setRates] = useState<{ currency: string; rate: number }[]>([
        { currency: 'TZS', rate: 2500 },
        { currency: 'EUR', rate: 0.92 }
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) fetchRates();
    }, [isOpen]);

    const fetchRates = async () => {
        if (!db) {
            console.error("Firestore is not initialized");
            return;
        }
        try {
            const docRef = doc(db, 'settings', 'finance');
            const snapshot = await getDoc(docRef);
            if (snapshot.exists() && snapshot.data().exchangeRates) {
                const data = snapshot.data();
                setBaseCurrency(data.baseCurrency || 'USD');
                const rateArray = Object.entries(data.exchangeRates).map(([currency, rate]) => ({
                    currency,
                    rate: Number(rate)
                }));
                setRates(rateArray);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        if (!db) {
            showToast('Database not initialized', 'error');
            return;
        }
        setLoading(true);
        try {
            const rateObj: Record<string, number> = {};
            rates.forEach(r => {
                if (r.currency && r.rate) rateObj[r.currency] = r.rate;
            });

            await setDoc(doc(db, 'settings', 'finance'), {
                baseCurrency,
                exchangeRates: rateObj,
                updatedAt: new Date()
            }, { merge: true });

            onRatesUpdated(rateObj);
            showToast('Exchange rates updated', 'success');
            onClose();
        } catch (error) {
            showToast('Failed to save rates', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title="Finance Settings & Exchange Rates"
            size="md"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:opacity-90">
                        {loading ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold mb-2">Base Currency</label>
                    <select
                        value={baseCurrency}
                        onChange={e => setBaseCurrency(e.target.value)}
                        className="w-full border p-2 rounded-lg"
                    >
                        <option value="USD">USD ($)</option>
                        <option value="TZS">TZS (TSh)</option>
                        <option value="EUR">EUR (€)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">All reports will be calculated in this currency.</p>
                </div>

                <div>
                    <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-gray-500">Manual Exchange Rates</h3>
                    <div className="space-y-3">
                        {rates.map((r, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <span className="text-gray-500 font-mono">1 {baseCurrency} = </span>
                                <input
                                    type="number"
                                    value={r.rate}
                                    onChange={e => {
                                        const newRates = [...rates];
                                        newRates[idx].rate = Number(e.target.value);
                                        setRates(newRates);
                                    }}
                                    className="border p-2 rounded-lg w-32 text-right"
                                />
                                <input
                                    type="text"
                                    value={r.currency}
                                    onChange={e => {
                                        const newRates = [...rates];
                                        newRates[idx].currency = e.target.value.toUpperCase();
                                        setRates(newRates);
                                    }}
                                    className="border p-2 rounded-lg w-20 font-bold"
                                    placeholder="CUR"
                                />
                            </div>
                        ))}
                        <button
                            onClick={() => setRates([...rates, { currency: '', rate: 1 }])}
                            className="text-sm text-[#FF6A00] hover:underline"
                        >
                            + Add Currency
                        </button>
                    </div>
                </div>
            </div>
        </Drawer>
    );
}
