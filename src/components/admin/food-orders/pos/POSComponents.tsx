import React from 'react';
import { MenuItem } from '@/lib/firestoreService';
import { PlusIcon, TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

// ================= TYPES =================
interface CartItem extends MenuItem {
    quantity: number;
    specialInstructions?: string;
}

// ================= CART SIDEBAR =================
interface POSCartProps {
    cart: CartItem[];
    onRemove: (itemId: string) => void;
    onUpdateQty: (itemId: string, delta: number) => void;
    onSubmit: () => void;
    subtotal: number;
    tax: number;
    total: number;
    isSubmitting: boolean;
    canSubmit: boolean;
}

export function POSCart({
    cart, onRemove, onUpdateQty, onSubmit,
    subtotal, tax, total, isSubmitting, canSubmit
}: POSCartProps) {
    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl w-96 fixed right-0 top-0 bottom-0 z-30 pt-[72px]"> {/* Adjusted top padding for header */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <ShoppingCartIcon className="h-5 w-5" />
                    Current Order
                </h3>

                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <ShoppingCartIcon className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-sm">Cart is empty</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cart.map((item) => (
                            <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-md border border-gray-100 group">
                                {/* Qty Controls */}
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <button
                                        onClick={() => onUpdateQty(item.id, 1)}
                                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded hover:border-[#FF6A00] hover:text-[#FF6A00]"
                                    >
                                        <PlusIcon className="h-3 w-3" />
                                    </button>
                                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => onUpdateQty(item.id, -1)}
                                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded hover:border-red-500 hover:text-red-500"
                                    >
                                        <span className="text-lg leading-3">-</span>
                                    </button>
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                                        <span className="font-semibold text-gray-900 text-sm ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                </div>

                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="text-gray-400 hover:text-red-600 self-start mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cart Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span className="text-[#FF6A00]">${total.toFixed(2)}</span>
                </div>

                <button
                    onClick={onSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="w-full py-3 bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white font-bold rounded-lg shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95"
                >
                    {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
            </div>
        </div>
    );
}

// ================= MENU BROWSER =================
interface MenuBrowserProps {
    categories: any[];
    items: MenuItem[];
    onAddToCart: (item: MenuItem) => void;
}

export function MenuBrowser({ categories, items, onAddToCart }: MenuBrowserProps) {
    const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
    const [search, setSearch] = React.useState('');

    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="flex-1 p-6 overflow-y-auto h-full bg-slate-50">
            {/* Filters */}
            <div className="mb-8 space-y-4 sticky top-0 bg-slate-50 z-20 pb-4 pt-2">
                <div className="relative max-w-lg">
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-5 pr-10 py-4 rounded-xl border-0 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-[#FF6A00] outline-none text-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${selectedCategory === 'all'
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                            : 'bg-white text-slate-600 shadow-sm border border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        All Items
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${selectedCategory === cat.name
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                : 'bg-white text-slate-600 shadow-sm border border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-24">
                {filteredItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onAddToCart(item)}
                        className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group h-[280px]"
                    >
                        <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                            {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                                    <span className="text-xs font-black opacity-30 tracking-widest">NO IMAGE</span>
                                </div>
                            )}
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm font-bold text-slate-900 text-sm">
                                ${item.price}
                            </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1 w-full text-left relative">
                            <h4 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2 mb-1 group-hover:text-[#FF6A00] transition-colors">{item.name}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>

                            <div className="mt-auto w-full pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 text-[#FF6A00] font-bold text-xs flex items-center gap-1 uppercase tracking-wide">
                                <PlusIcon className="w-4 h-4" /> Add to Order
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
