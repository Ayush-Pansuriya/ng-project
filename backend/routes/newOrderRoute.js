const express = require('express');
const Order = require('../schema/order'); // Ensure the correct path
const Cart = require('../schema/cart'); // Import Cart schema to fetch cart items
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sjhguhyurhgnerpgjijiejigjniejrgijjeirjtij34847jngjuh'); // Use environment variable for Stripe secret key

// Place a new order
router.post('/place', async (req, res) => {
    const { user, shippingAddress, paymentmethod } = req.body;

    try {
        // Find user's cart
        const cart = await Cart.findOne({ user }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // Calculate total price
        let total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

        // Payment processing logic
        let paymentIntent;
        try {
            paymentIntent = await stripe.paymentIntents.create({
                amount: total * 100, // Total amount to charge in cents
                currency: 'usd', // Currency
                payment_method: paymentmethod, // Payment method ID
                confirmation_method: 'manual',
                confirm: true,
            });
        } catch (error) {
            console.error("Error processing payment:", error);
            return res.status(500).json({ message: "Payment processing error" });
        }

        // Create new order
        const order = new Order({
            user,
            items: cart.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity
            })),
            total,
            shippingAddress,
            paymentmethod
        });

        await order.save();

        // Clear user's cart after placing order
        await Cart.findOneAndDelete({ user });

        res.status(201).json({ message: "Order placed successfully", order, paymentIntent });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ message: "Error placing order" });
    }
});

// Get orders for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.userId }).populate('items.product');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all orders (Admin)
router.get('/all', async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'name email').populate('items.product');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
