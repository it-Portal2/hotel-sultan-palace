import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getMealPlanSettings, updateMealPlanSettings, MealPlanSettings } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';

interface MealPlanSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MealPlanSettingsModal({ isOpen, onClose }: MealPlanSettingsModalProps) {
    const { showToast } = useToast();
    const [settings, setSettings] = useState<MealPlanSettings>({
        adultHalfBoardPrice: 30,
        adultFullBoardPrice: 50,
        childHalfBoardPrice: 20,
        childFullBoardPrice: 30
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await getMealPlanSettings();
            setSettings(data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const success = await updateMealPlanSettings(settings);
            if (success) {
                showToast('Meal plan settings updated', 'success');
                onClose();
            } else {
                showToast('Failed to update settings', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to update settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: keyof MealPlanSettings, value: string) => {
        const numValue = parseFloat(value);
        setSettings(prev => ({
            ...prev,
            [key]: isNaN(numValue) ? 0 : numValue
        }));
    };

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={React.Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                                        <div className="px-4 py-6 sm:px-6">
                                            <div className="flex items-start justify-between">
                                                <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                                                    Meal Plan Rates
                                                </Dialog.Title>
                                                <div className="ml-3 flex h-7 items-center">
                                                    <button
                                                        type="button"
                                                        className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                        onClick={onClose}
                                                    >
                                                        <span className="absolute -inset-2.5" />
                                                        <span className="sr-only">Close panel</span>
                                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Set the daily supplement prices for Half Board and Full Board options.
                                            </p>
                                        </div>
                                        <div className="relative flex-1 px-4 sm:px-6">
                                            {loading ? (
                                                <div className="py-10 text-center text-gray-500">Loading settings...</div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Adult Rates</h4>
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Half Board ($)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={settings.adultHalfBoardPrice}
                                                                    onChange={(e) => handleChange('adultHalfBoardPrice', e.target.value)}
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Full Board ($)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={settings.adultFullBoardPrice}
                                                                    onChange={(e) => handleChange('adultFullBoardPrice', e.target.value)}
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-gray-200 pt-6">
                                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Child Rates</h4>
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Half Board ($)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={settings.childHalfBoardPrice}
                                                                    onChange={(e) => handleChange('childHalfBoardPrice', e.target.value)}
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Full Board ($)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={settings.childFullBoardPrice}
                                                                    onChange={(e) => handleChange('childFullBoardPrice', e.target.value)}
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-shrink-0 justify-end px-4 py-4 bg-gray-50 border-t border-gray-200">
                                            <button
                                                type="button"
                                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                                onClick={onClose}
                                                disabled={loading || saving}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="ml-4 inline-flex justify-center rounded-md bg-[#FF6A00] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#e65f00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                                onClick={handleSave}
                                                disabled={loading || saving}
                                            >
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
