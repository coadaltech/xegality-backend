import { UpdateTransactionType } from "@/models/shared/payments.model";

const create_order = async (body: UpdateTransactionType) => {
}


// try {
//   const { amount, currency, receipt, notes } = body;
//
//   const options = {
//     amount: amount * 100, // Convert amount to paise
//     currency,
//     receipt,
//     notes,
//   };
//
//   const order = await razorpay.orders.create(options);
//
//   // Read current orders, add new order, and write back to the file
//   const orders = readData();
//   orders.push({
//     order_id: order.id,
//     amount: order.amount,
//     currency: order.currency,
//     receipt: order.receipt,
//     status: 'created',
//   });
//   writeData(orders);
//
//   res.json(order); // Send order details to frontend, including order ID
// } catch (error) {
//   console.error(error);
//   res.status(500).send('Error creating order');
// }
