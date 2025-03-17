const mongoose = require("mongoose");

// Schema for each item in the order
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // References the Product model
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

// Schema for payment details (dynamic structure)
const paymentDetailsSchema = new mongoose.Schema({
  cardNumber: { type: String, required: false },
  expiryDate: { type: String, required: false },
  cvv: { type: String, required: false },
  accountNumber: { type: String, required: false },
  routingNumber: { type: String, required: false },
  paypalEmail: { type: String, required: false }
}, { _id: false }); // No need for an _id for this subdocument

// Main Order Schema
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assumes you have a User model
    required: true
  },
  items: [orderItemSchema], // Array of items
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["credit-card", "bank-transfer", "paypal"] // Restrict to valid payment methods
  },
  paymentDetails: {
    type: paymentDetailsSchema,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"], // Order status
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the Order model
module.exports = mongoose.model("Order", orderSchema);