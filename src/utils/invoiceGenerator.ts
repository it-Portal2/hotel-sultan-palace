import { Booking } from '@/lib/firestoreService';

export const generateInvoiceHTML = (booking: Booking, foodOrders: any[] = [], guestServices: any[] = [], transactions: any[] = []): string => {
    const guestName = `${booking.guestDetails.prefix || ''} ${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`;

    // Calculate nights
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Totals Calculation
    const roomTotal = booking.rooms?.reduce((acc, r) => acc + (r.price || 0), 0) * nights;
    const mealPlanTotal = booking.rooms?.reduce((acc, r) => acc + (r.mealPlanPrice || 0), 0) * nights;

    const foodTotal = foodOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
    const serviceTotal = guestServices.reduce((acc, s) => acc + (s.totalAmount || s.amount || 0), 0);
    const addOnsTotal = booking.addOns?.reduce((acc, a) => acc + ((a.price || 0) * (a.quantity || 1)), 0) || 0;

    // DEDUPLICATION LAB (Same as FolioDetailsDrawer)
    const serviceTransactionIds = new Set(guestServices.map(s => s.transactionId).filter(Boolean));
    const foodTransactionIds = new Set(foodOrders.map(f => (f as any).transactionId).filter(Boolean));

    const uniqueTransactions = transactions.filter(t => {
        if (t.type !== 'charge') return true;

        // Direct Link Check
        if (serviceTransactionIds.has(t.id)) return false;

        // Reference Prefix Check
        if (t.reference?.startsWith('SVC-') && guestServices.some(s => t.reference?.includes(s.id.slice(-6).toUpperCase()))) return false;
        if (t.reference?.startsWith('ORD-') && foodOrders.map(f => f.orderNumber).filter(Boolean).some(num => t.reference?.includes(num))) return false;

        // Robust Deduplication: Match by Amount + Description Pattern
        const isSystemGeneratedServiceCharge = (t.description || '').startsWith('Service Charge:');
        if (isSystemGeneratedServiceCharge) {
            const hasMatchingServiceByAmount = guestServices.some(s => {
                const serviceAmount = s.totalAmount || s.amount || 0;
                return Math.abs(serviceAmount - t.amount) < 1;
            });
            if (hasMatchingServiceByAmount) return false;
        }

        const isServiceDuplicate = guestServices.some(s => {
            const serviceName = (s.serviceType || '').toLowerCase().replace('_', ' ');
            const txDesc = (t.description || '').toLowerCase();
            return txDesc.includes(serviceName) || txDesc.includes('service charge');
        });
        if (isServiceDuplicate && t.category !== 'room_charge') return false;

        return true;
    });

    const otherCharges = uniqueTransactions.filter(t => t.type === 'charge').reduce((acc, t) => acc + (t.amount || 0), 0);
    // Explicitly sum payments from transactions if needed, or rely on booking.paidAmount.
    // Invoice usually just declares Total Due vs Paid.

    const grossTotal = roomTotal + mealPlanTotal + foodTotal + serviceTotal + addOnsTotal + otherCharges;

    // Allow for manual discount or implied discount from Booking total mismatch
    let discountAmount = booking.discount?.amount || 0;

    const grandTotal = grossTotal - discountAmount;
    const paidAmount = booking.paidAmount || 0;
    const balance = grandTotal - paidAmount;

    // Filter only manual charge transactions for display
    const visibleTransactions = uniqueTransactions.filter(t => t.type === 'charge');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice - ${booking.bookingId}</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 30px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .header .logo img { max-width: 150px; }
            .header-info { text-align: right; }
            .header-info h1 { margin: 0; font-size: 24px; color: #444; }
            .header-info p { margin: 5px 0; font-size: 14px; color: #777; }
            
            .bill-to { margin-bottom: 30px; }
            .bill-to h3 { margin-top: 0; font-size: 16px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
            .bill-to p { margin: 3px 0; font-size: 14px; }

            .table-container { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table-container th { background: #f9f9f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; }
            .table-container td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }

            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .totals-row.final { border-top: 2px solid #333; border-bottom: none; font-size: 18px; font-weight: bold; margin-top: 10px; padding-top: 15px; }

            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { body { padding: 0; } .invoice-box { border: none; box-shadow: none; padding: 0; } }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="header">
                <div class="logo">
                    <h2 style="margin:0; color:#BE8C53;">SULTAN PALACE</h2>
                    <p style="margin:0; font-size:12px; letter-spacing:2px;">ZANZIBAR</p>
                </div>
                <div class="header-info">
                    <h1>INVOICE</h1>
                    <p>Invoice #: INV-${booking.bookingId.replace(/[^0-9]/g, '').slice(-6)}</p>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                    <p>Booking ID: ${booking.bookingId}</p>
                </div>
            </div>

            <div class="bill-to">
                <h3>Bill To</h3>
                <p><strong>${guestName}</strong></p>
                <p>${booking.guestDetails.email || ''}</p>
                <p>${booking.guestDetails.phone || ''}</p>
            </div>

            <table class="table-container">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-right">Price</th>
                        <th class="text-right">Qty/Nights</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Rooms -->
                    ${booking.rooms.map(room => `
                    <tr>
                        <td>
                            <strong>${room.type || room.allocatedRoomType}</strong><br>
                            <span style="font-size:12px; color:#888;">Meal Plan: ${room.mealPlan || 'BB'}</span>
                        </td>
                        <td class="text-right">${(room.price || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                        <td class="text-right">${nights}</td>
                        <td class="text-right">${((room.price || 0) * nights).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                    </tr>
                    ${room.mealPlanPrice ? `
                    <tr>
                        <td style="padding-left:20px; color:#666;">Meal Plan Supplement (${room.mealPlan})</td>
                        <td class="text-right">${(room.mealPlanPrice || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                        <td class="text-right">${nights}</td>
                        <td class="text-right">${(room.mealPlanPrice * nights).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                    </tr>` : ''}
                    `).join('')}

                    <!-- Add-ons -->
                    ${booking.addOns.map(addon => `
                    <tr>
                        <td>${addon.name}</td>
                        <td class="text-right">${(addon.price || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                        <td class="text-right">${addon.quantity}</td>
                        <td class="text-right">${((addon.price || 0) * addon.quantity).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                    </tr>
                    `).join('')}

                    <!-- Food Orders -->
                    ${foodOrders.length > 0 ? `
                    <tr><td colspan="4" style="background:#fff3e0; font-weight:bold; font-size:12px;">RESTAURANT ORDERS</td></tr>
                    ${foodOrders.map(order => `
                    <tr>
                        <td>Order #${order.orderNumber} <span style="font-size:11px; color:#777;">(${new Date(order.createdAt).toLocaleDateString()})</span></td>
                        <td class="text-right">-</td>
                        <td class="text-right">1</td>
                        <td class="text-right">${(order.totalAmount || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                    </tr>
                    `).join('')}
                    ` : ''}

                    <!-- Guest Services -->
                    ${guestServices.length > 0 ? `
                    <tr><td colspan="4" style="background:#e3f2fd; font-weight:bold; font-size:12px;">SERVICES</td></tr>
                    ${guestServices.map(service => `
                    <tr>
                        <td>${service.description || service.serviceType}</td>
                        <td class="text-right">-</td>
                        <td class="text-right">1</td>
                        <td class="text-right">${(service.totalAmount || service.amount || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                    </tr>
                    `).join('')}
                    ` : ''}

                    <!-- Other Transactions -->
                    ${visibleTransactions.length > 0 ? `
                    <tr><td colspan="4" style="background:#fcfcfc; font-weight:bold; font-size:12px; border-top: 1px solid #ddd;">OTHER CHARGES</td></tr>
                    ${visibleTransactions.map(t => `
                    <tr>
                        <td>${t.description} <span style="font-size:11px; color:#777;">(${new Date(t.date).toLocaleDateString()})</span></td>
                        <td class="text-right">${(t.amount || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                        <td class="text-right">1</td>
                        <td class="text-right">${(t.amount || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                    </tr>
                    `).join('')}
                    ` : ''}
                </tbody>
            </table>

            <div class="totals">
                <div class="totals-row">
                    <span>Subtotal</span>
                    <span>${grossTotal.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
                </div>
                ${discountAmount > 0 ? `
                <div class="totals-row" style="color:green;">
                    <span>Discount</span>
                    <span>-${discountAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
                </div>` : ''}
                
                <div class="totals-row final">
                    <span>Total Due</span>
                    <span>${grandTotal.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
                </div>
                <div class="totals-row">
                     <span>Paid</span>
                     <span>${paidAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
                </div>
                <div class="totals-row" style="font-weight:bold; color: ${balance > 0 ? '#d9534f' : '#5cb85c'};">
                     <span>Balance</span>
                     <span>${balance.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
                </div>
            </div>

            <div class="footer">
                <p>Thank you for your business!</p>
                <p>Sultan Palace Hotel, Dongwe, Zanzibar</p>
            </div>
        </div>
        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;
};

export const generatePurchaseOrderHTML = (po: any): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Purchase Order - ${po.poNumber}</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 30px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .header-info h1 { margin: 0; font-size: 28px; color: #BE8C53; }
            .header-info p { margin: 5px 0; font-size: 14px; color: #777; }
            
            .bill-to { margin-bottom: 30px; display: flex; justify-content: space-between; }
            .bill-to-section { width: 48%; }
            .bill-to h3 { margin-top: 0; font-size: 14px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
            .bill-to p { margin: 3px 0; font-size: 14px; font-weight: bold; }
            .bill-to .details { font-weight: normal; font-size: 13px; color: #555; }

            .table-container { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table-container th { background: #f9f9f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; }
            .table-container td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
            .text-right { text-align: right; }
            
            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .totals-row.final { border-top: 2px solid #333; border-bottom: none; font-size: 18px; font-weight: bold; margin-top: 10px; padding-top: 15px; }

            .status-badge { 
                padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; display: inline-block; margin-top: 10px;
                background: ${po.status === 'received' ? '#e8f5e9' : po.status === 'ordered' ? '#e3f2fd' : '#f5f5f5'};
                color: ${po.status === 'received' ? '#2e7d32' : po.status === 'ordered' ? '#1565c0' : '#616161'};
                border: 1px solid ${po.status === 'received' ? '#c8e6c9' : po.status === 'ordered' ? '#bbdefb' : '#eeeeee'};
            }

            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="header">
                <div class="header-info">
                    <h1>PURCHASE ORDER</h1>
                    <p>PO #: <strong>${po.poNumber}</strong></p>
                    <p>Date: ${new Date(po.createdAt).toLocaleDateString()}</p>
                    <div class="status-badge">${po.status}</div>
                </div>
                <div class="header-logo" style="text-align: right;">
                    <h2 style="margin:0; color:#333;">Sultan Palace Hotel</h2>
                    <p style="margin:0; font-size:12px; color:#777;">Dongwe, Zanzibar</p>
                </div>
            </div>

            <div class="bill-to">
                <div class="bill-to-section">
                    <h3>Vendor / Supplier</h3>
                    <p>${po.supplierName || 'Unknown Supplier'}</p>
                    <div class="details">
                        <!-- Add supplier details if available in the future -->
                    </div>
                </div>
                <div class="bill-to-section" style="text-align: right;">
                    <h3>Ship To</h3>
                    <p>Sultan Palace Hotel</p>
                    <div class="details">
                        Dongwe, Zanzibar<br>
                        Tanzania
                    </div>
                </div>
            </div>

            <table class="table-container">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="text-right">Unit Cost</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${po.items?.map((item: any) => `
                    <tr>
                        <td>
                            <strong>${item.itemName}</strong>
                        </td>
                        <td class="text-right">${(item.unitCost || 0).toLocaleString(undefined, { style: 'currency', currency: 'TZS' })}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${(item.totalCost || 0).toLocaleString(undefined, { style: 'currency', currency: 'TZS' })}</td>
                    </tr>
                    `).join('') || '<tr><td colspan="4">No items</td></tr>'}
                </tbody>
            </table>

            <div class="totals">
                <div class="totals-row final">
                    <span>Total Amount</span>
                    <span>${(po.totalAmount || 0).toLocaleString(undefined, { style: 'currency', currency: 'TZS' })}</span>
                </div>
            </div>

            ${po.notes ? `
            <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                <h3 style="font-size: 12px; color: #666; margin: 0 0 5px 0;">NOTES</h3>
                <p style="font-size: 13px; color: #333; margin: 0;">${po.notes}</p>
            </div>
            ` : ''}

            <div class="footer">
                <p>Authorized Signature: ___________________________</p>
                <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
        </div>
        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;
};
