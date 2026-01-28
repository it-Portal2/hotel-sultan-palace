/**
 * Currency Helper Utility
 */

/**
 * Formats a number into a currency string based on the selected currency and rates.
 * 
 * @param amount The value in the SYSTEM DEFAULT currency (assumed to be the base for data entry, e.g. TZS)
 * @param targetCurrency The currency to display the value in (e.g. USD)
 * @param rates A map of exchange rates relative to the SYSTEM DEFAULT or BASE.
 *              Access pattern: rates[targetCurrency] = value
 *              
 *              NOTE: The `ExchangeRateDrawer` saves rates as "1 Base = X Target".
 *              If Base is USD, and Rate is TZS=2500, then 1 USD = 2500 TZS.
 *              
 *              If our DATA is in TZS (System Default), and we want to show USD:
 *              We need to Divide by the rate (if rate is TZS per USD).
 *              
 *              Let's standardize:
 *              - `rates` object from DB usually looks like: { TZS: 2500, EUR: 0.92 } relative to a 'baseCurrency' (e.g. USD).
 *              - If `baseCurrency` in DB is USD:
 *                  - 1 USD = 2500 TZS
 *                  - 1 USD = 0.92 EUR
 *              
 *              Scenario A: Data is in TZS (Local). User wants to see USD.
 *              - Convert TZS -> USD.
 *              - Formula: TZS / 2500 = USD.
 *              
 *              Scenario B: Data is in TZS. User wants to see EUR.
 *              - Convert TZS -> USD (Base) -> EUR.
 *              - TZS / 2500 = USD.
 *              - USD * 0.92 = EUR.
 *              
 *              Scenario C: Data is in TZS. User wants to see TZS.
 *              - No conversion.
 *              
 * @param baseCurrency The currency that the `rates` are keyed against (from DB settings).
 */
export const formatCurrency = (
    amount: number,
    targetCurrency: string,
    rates: Record<string, number>,
    baseSettingCurrency: string = 'USD' // The currency that 1.00 equals the rates.
): string => {
    // 1. Determine the "Value in Base Setting Currency (e.g. USD)"
    // Assumption: The stored data (amount) is in TZS (Tanzanian Shilling) - Local Currency.
    // We need to know the rate of TZS relative to the Base Setting Currency to normalize it.

    // If we don't have rates, returns raw amount with target code
    if (!rates || Object.keys(rates).length === 0) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: targetCurrency }).format(amount);
    }

    // Find the rate for TZS (System Default)
    // If the system default is NOT in the rates, we assume the Base Setting Currency IS the system default?
    // Let's assume 'TZS' is the hardcoded system default for data entry for now, as per user context (hotel in Zanzibar/Tanzania likely).
    const SYSTEM_DATA_CURRENCY = 'TZS';

    let valueInBase = amount;

    if (baseSettingCurrency === SYSTEM_DATA_CURRENCY) {
        // Base is TZS. Value is TZS.
        valueInBase = amount;
    } else {
        // Base is USD. Data is TZS.
        // We need 1 USD = X TZS.
        const tzsRate = rates[SYSTEM_DATA_CURRENCY]; // e.g. 2500
        if (tzsRate) {
            valueInBase = amount / tzsRate;
        }
    }

    // 2. Convert "Value in Base" to "Target Currency"
    let finalValue = valueInBase;

    if (targetCurrency === baseSettingCurrency) {
        finalValue = valueInBase;
    } else {
        const targetRate = rates[targetCurrency]; // e.g. 0.92 for EUR
        if (targetRate) {
            finalValue = valueInBase * targetRate;
        } else if (targetCurrency === SYSTEM_DATA_CURRENCY && baseSettingCurrency !== 'TZS') {
            // Case: We converted TZS->USD above, now want TZS back? (Redundant but consistent logic)
            // Actually if target IS the system currency, and we converted to base, we multiply back.
            // But simpler: if target == SYSTEM_DATA_CURRENCY, just use original amount? 
            // Yes, but let's trust the math for consistency if rates change.
            // For now, let's Stick to the Scenario B logic.
        }
    }

    // Edge Case: If target is TZS, just show original amount to avoid precision loss, 
    // UNLESS we want to strictly follow the defined rates.
    if (targetCurrency === SYSTEM_DATA_CURRENCY) {
        finalValue = amount;
    }

    // 3. Format
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: targetCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(finalValue);
};
