import { Booking } from '@/lib/firestoreService';

export const generateInvoiceHTML = (booking: Booking): string => {
    const guestName = `${booking.guestDetails.prefix || ''} ${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`;
    const checkInDate = new Date(booking.checkIn).toLocaleDateString();
    const checkOutDate = new Date(booking.checkOut).toLocaleDateString();
    const bookingDate = new Date(booking.createdAt).toLocaleDateString();

    // Calculate nights
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Logo URL - ensure this is correct or use a placeholder
    const logoUrl = '/logo.png'; // Assuming public placeholder or absolute path if hosted

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

            @media print {
                body { padding: 0; }
                .invoice-box { border: none; box-shadow: none; padding: 0; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="header">
                <div class="logo">
                     <!-- Replace with actual logo or text if image missing -->
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
                <p>${booking.address?.address1 || ''} ${booking.address?.city || ''}</p>
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
                        <td class="text-right">$${(room.price || 0).toFixed(2)}</td>
                        <td class="text-right">${nights}</td>
                        <td class="text-right">$${((room.price || 0) * nights).toFixed(2)}</td>
                    </tr>
                    ${room.mealPlanPrice ? `
                    <tr>
                        <td style="padding-left:20px; color:#666;">Meal Plan Supplement (${room.mealPlan})</td>
                        <td class="text-right">$${(room.mealPlanPrice || 0).toFixed(2)}</td>
                        <td class="text-right">${nights}</td>
                        <td class="text-right">$${(room.mealPlanPrice * nights).toFixed(2)}</td>
                    </tr>` : ''}
                    `).join('')}

                    <!-- Add-ons -->
                     ${booking.addOns.map(addon => `
                    <tr>
                        <td>${addon.name}</td>
                        <td class="text-right">$${(addon.price || 0).toFixed(2)}</td>
                        <td class="text-right">${addon.quantity}</td>
                        <td class="text-right">$${(addon.price * addon.quantity).toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="totals">
                <div class="totals-row">
                    <span>Subtotal</span>
                    <span>$${(booking.totalAmount || 0).toFixed(2)}</span>
                </div>
                <!-- Discount if applicable (assuming totalAmount is already net, but if we had discount data...) -->
                 ${(booking as any).discount ? `
                <div class="totals-row" style="color:green;">
                    <span>Discount (${(booking as any).discount.code})</span>
                    <span>-$${((booking as any).discount.amount || 0).toFixed(2)}</span>
                </div>` : ''}
                
                <div class="totals-row final">
                    <span>Total Due</span>
                    <span>$${(booking.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div class="totals-row">
                     <span>Paid</span>
                     <span>$${(booking.paidAmount || 0).toFixed(2)}</span>
                </div>
                <div class="totals-row" style="font-weight:bold; color: ${booking.totalAmount - (booking.paidAmount || 0) > 0 ? '#d9534f' : '#5cb85c'};">
                     <span>Balance</span>
                     <span>$${(booking.totalAmount - (booking.paidAmount || 0)).toFixed(2)}</span>
                </div>
            </div>

            <div class="footer">
                <p>Thank you for your business!</p>
                <p>Sultan Palace Hotel, Dongwe, Zanzibar | +255 123 456 789 | info@sultanpalace.com</p>
            </div>
        </div>
        <script>
            window.onload = function() { window.print(); }
        </script>
    </body>
    </html>
    `;
};
