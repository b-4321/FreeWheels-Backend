const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require("./Routes/auth");
const bookingRoutes = require("./Routes/bookings");
const vehiclesData = require("./vehicles");
const Vehicle = require('./Models/Vehicle')
const Booking = require('./Models/Booking')


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB', err);
});

app.use('/api/auth',authRoutes);
app.use('/api/bookings',bookingRoutes);

app.post('/api/vehicles/search',async(req,res) => {
    const {startDate,endDate,startTime,endTime} = req.body;
    console.log("req data",req.body);



    if(!startDate || !endDate  || !startTime || !endTime){
        return res.status(400).json({error:"Missing required parameters"});
    }


    try{
        const dayjs = require("dayjs");
        const customParseFormat = require("dayjs/plugin/customParseFormat");
        dayjs.extend(customParseFormat);

        const startDateTime = dayjs(`${startDate} ${startTime}`,'YYYY-MM-DD hh:mm A').toDate();
        const endDateTime = dayjs(`${endDate} ${endTime}`,'YYYY-MM-DD hh:mm A').toDate();

        if(endDateTime <= startDateTime){
            return res.status(400).json({error:"End datetime must be  after start datetime"});
        }


        const durationMs = endDateTime - startDateTime;
        const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
        const remainingMs = durationMs % (1000 * 60 * 60 * 24);
        const durationHours = Math.floor(remainingMs / (1000 * 60 * 60 ));
        const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60 )) / (1000 *  60));

        const allVehicles = await Vehicle.find();

        const bookings = await Booking.find({
            startDate:{$lt:endDateTime},
            endDate:{$gt:startDateTime}
        });


        const results = allVehicles.map(vehicle => {
            const totalDays = durationDays + (durationHours / 24) + (remainingMinutes / (24 * 60));
            const totalPrice = Math.ceil(totalDays * vehicle.pricePerDay);
            const totalIncludedKm = Math.ceil(totalDays * vehicle.includedKm);

            const availability = vehicle.locations.reduce((acc,location) => {
                const isBooked = bookings.some(booking => 

                    booking.vehicleId.toString() == vehicle._id.toString() &&
                    booking.location === location &&
                    booking.startDate < endDateTime  &&
                    booking.endDate > startDateTime
                );
                acc[location] = !isBooked;
                return acc;
            },{});

            return {
                ...vehicle.toObject(),
                calculatedPrice:totalPrice,
                calculatedIncludedKm:totalIncludedKm,
                duration:`${durationDays} Days ${durationHours} Hours ${remainingMinutes} Minutes`,
                availability
            }
        })

        res.json(results);

    }catch(err){
        console.log("Error",err);
        res.status(500).json({error:"server error"});
    }
})


const seedVehicles = async () => {
    try{
        const collection = mongoose.connection.collection("vehicles");

        const existingVehicles = await collection.distinct('number');
        const newVehicles = vehiclesData.filter(vehicle => !existingVehicles.includes(vehicle.number));

        if(newVehicles.length > 0){
            const result = await Vehicle.insertMany(newVehicles,{ordered:false});
            console.log(`Vehicles seeded successfully: ${result.length} new vehicles added`);
        }else{
            console.log("no new vehicles to seed all data already exists");
        }

    }catch(err){
        if(err.code === 11000){
            console.log("Duplicate key error occurred");
        }else{
            console.log("Error seeding the vehicles");
        }
        
    }
} 


seedVehicles();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});