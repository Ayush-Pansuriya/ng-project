const express = require("express");
const mongoose = require("mongoose");
const Product = require("../schema/product");
const Cart = require("../schema/cart");
const Order = require("../schema/order");
const { authenticate } = require("../middleware/authenticate");


const router = express.Router();

router.use(authenticate);
router.post("/add", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ message: "Unauthorized: User not authenticated" });

    const { _id, quantity } = req.body;
    if (!_id) return res.status(400).json({ message: "Invalid request: pid is required" });

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ message: "Invalid quantity: must be a positive number" });
    }

    const product = await Product.findOne({ _id });
    if (!product) return res.status(404).json({ message: `Product with pid ${_id} not found` });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.product.toString() === product._id.toString());
    if (existingItem) {
      existingItem.quantity += parsedQuantity;
    } else {
      cart.items.push({ product: product._id, quantity: parsedQuantity, price: product.price });
    }

    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    await cart.save();
    const populatedCart = await Cart.findOne({ user: userId }).populate("items.product");
    res.status(200).json({ message: "Product added to cart", cart: populatedCart });
  } catch (error) {
    console.error("Error adding to cart:", error.stack);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});
router.post("/remove", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { pid } = req.body;
    if (!pid) return res.status(400).json({ message: "Invalid request: pid is required" });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const product = await Product.findOne({ pid });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.product.toString() !== product._id.toString());

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    await cart.save();
    const populatedCart = await Cart.findOne({ user: userId }).populate("items.product");
    res.status(200).json({ message: "Product removed from cart", cart: populatedCart });
  } catch (error) {
    console.error("Error removing from cart:", error.stack);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// Clear Cart
router.delete("/clear", async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    cart.totalPrice = 0;
    cart.totalQuantity = 0;

    await cart.save();
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});router.get("/get", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized: User not authenticated" });

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.map((item) => {
      if (!item.product) {
        console.warn(`Product not found for item: ${item.product}`);
        return { ...item._doc, product: null };
      }
      return {
        ...item._doc,
        product: {
          _id: item.product._id,
          pid: item.product.pid,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image || ''
        }
      };
    });
    res.status(200).json(cart);

  } catch (error) {
    console.error("Error getting cart:", error.stack);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});
// Checkout
router.post("/checkout", async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod, paymentDetails } = req.body;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: "Shipping address and payment method are required" });
    }
    if (!paymentDetails) {
      return res.status(400).json({ message: "Payment details are required" });
    }

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (paymentMethod === 'credit-card' && (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv)) {
      return res.status(400).json({ message: "Card number, expiry date, and CVV are required" });
    }
    if (paymentMethod === 'bank-transfer' && (!paymentDetails.accountNumber || !paymentDetails.routingNumber)) {
      return res.status(400).json({ message: "Account number and routing number are required" });
    }
    if (paymentMethod === 'paypal' && !paymentDetails.paypalEmail) {
      return res.status(400).json({ message: "PayPal email is required" });
    }

    const order = new Order({
      userId,
      items: cart.items,
      totalPrice: cart.totalPrice,
      shippingAddress,
      paymentMethod,
      paymentDetails,
      status: "pending",
      createdAt: new Date()
    });

    await order.save();

    cart.items = [];
    cart.totalPrice = 0;
    cart.totalQuantity = 0;
    await cart.save();

    res.status(200).json({ message: "Checkout successful", order });
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});// Increment Product Quantity in Cart
router.post("/increment/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const existingItem = cart.items.find((item) => item.product.toString() === product._id.toString());
    if (!existingItem) {
      return res.status(404).json({ message: "Product not in cart" });
    }

    existingItem.quantity += 1;
    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    await cart.save();
    const updatedCart = await Cart.findOne({ user: userId }).populate("items.product", "pid name price image");
    res.status(200).json({ message: "Quantity increased", cart: updatedCart });
  } catch (error) {
    console.error("Error incrementing quantity:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Decrement Product Quantity in Cart
router.post("/decrement/:id", async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const existingItem = cart.items.find((item) => item.product.toString() === product._id.toString());
    if (!existingItem) {
      return res.status(404).json({ message: "Product not in cart" });
    }

    if (existingItem.quantity > 1) {
      existingItem.quantity -= 1;
    } else {
      cart.items = cart.items.filter((item) => item.product.toString() !== product._id.toString());
    }

    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    await cart.save();
    const updatedCart = await Cart.findOne({ user: userId }).populate("items.product", "pid name price image");
    res.status(200).json({ message: "Quantity decreased", cart: updatedCart });
  } catch (error) {
    console.error("Error decrementing quantity:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;