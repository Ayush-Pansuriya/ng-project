const mongoose = require("mongoose");
 const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  description: String,
  category: String,
  stock: Number,
  pid:{type:String,unique:true}
});


module.exports = mongoose.model("Product", productSchema);
