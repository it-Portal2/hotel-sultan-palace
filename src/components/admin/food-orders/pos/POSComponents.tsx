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
        <div className="flex-1 p-6 overflow-y-auto h-full bg-gray-50/50">
            {/* Filters */}
            <div className="mb-6 space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search menu items..."
                        className="w-full pl-4 pr-10 py-3 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedCategory === 'all'
                            ? 'bg-[#FF6A00] text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-[#FF6A00]'
                            }`}
                    >
                        All Items
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.name)} // Assuming 'name' matches item.category
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${selectedCategory === cat.name
                                ? 'bg-[#FF6A00] text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#FF6A00]'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                {filteredItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onAddToCart(item)}
                        className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#FF6A00] transition-all text-left h-full group"
                    >
                        {item.image ? (
                            <div className="h-32 w-full bg-gray-100 relative overflow-hidden">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                        ) : (
                            <div className="h-32 w-full bg-gray-100 flex items-center justify-center text-gray-300">
                                <span className="text-xs font-mono">NO IMAGE</span>
                            </div>
                        )}
                        <div className="p-3 flex flex-col flex-1 w-full">
                            <div className="flex justify-between items-start w-full">
                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-[#FF6A00] transition-colors">{item.name}</h4>
                                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">${item.price}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>

                            <div className="mt-auto pt-3 w-full">
                                <div className="w-full py-1.5 bg-gray-50 text-[#FF6A00] text-xs font-bold text-center rounded border border-transparent group-hover:bg-[#FF6A00] group-hover:text-white transition-colors">
                                    ADD TO ORDER
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
