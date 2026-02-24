const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    name:String,
    number:{type:String, unique:true},
    image:String,
    locations:[String],
    type:String,
    pricePerDay:Number,
    includedKm:Number,
    totalPriceFor2Days:Number,
    includedKmFor2Days:Number,
    bookings:[{
        startDate: Date,
        endDate: Date,
        location: String,
    }],
});


module.exports = mongoose.model('Vehicle', vehicleSchema);