// const { Phone } = require('lucide-react-native');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String},
    email: { type: String, unique: true ,sparse: true},
});

module.exports = mongoose.model('User', userSchema);