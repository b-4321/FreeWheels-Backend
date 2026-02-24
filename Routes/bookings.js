const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Booking = require("../Models/Booking");
const Vehicle = require("../Models/Vehicle");


const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access Denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(403).json({ error: 'Invalid token' });
    }
};


// router.post("/create", authenticateToken, async (req, res) => {
//     const { vehicleId, startDate, endDate, startTime, endTime, location, totalPrice } = req.body;

//     if (!vehicleId || !startDate || !endDate || !startTime || !endTime || !location || !totalPrice) {
//         return res.status(400).json({ error: "Missing required parameters" });
//     }

//     try {
//         const booking = new Booking({
//             userId: req.userId,
//             vehicleId,
//             startDate,
//             endDate,
//             startTime,
//             endTime,
//             location,
//             totalPrice,
//             status: "Confirmed"
//         });

//         await booking.save();

//         await Vehicle.findByIdAndUpdate(vehicleId, {
//             $push: {
//                 bookings: {
//                     startDate: new Date(startDate),
//                     endDate: new Date(endDate),
//                     location: location
//                 }
//             }
//         });


//         res.json({ message: "Booking created successfully", booking });
//     } catch (err) {
//         console.error("Error creating booking", err);

//     }
// })

router.post("/create", authenticateToken, async (req, res) => {
    const { vehicleId, startDate, endDate, startTime, endTime, location, totalPrice } = req.body;

    if (!vehicleId || !startDate || !endDate || !startTime || !endTime || !location || !totalPrice) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {

        // ✅ Create booking
        const booking = await Booking.create({
            userId: req.userId,
            vehicleId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            startTime,
            endTime,
            location,
            totalPrice,
            status: "Confirmed"
        });

        // ✅ Update vehicle bookings (optional if you still want embedded)
        await Vehicle.findByIdAndUpdate(vehicleId, {
            $push: {
                bookings: {
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    location
                }
            }
        });

        // ✅ IMPORTANT: Populate before sending response
        const populatedBooking = await Booking.findById(booking._id)
            .populate("vehicleId")
            .populate("userId");

        return res.json({
            message: "Booking created successfully",
            booking: populatedBooking
        });

    } catch (err) {
        console.error("Error creating booking", err);
        return res.status(500).json({ error: "Server error" });
    }
});


router.get("/user", authenticateToken, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.userId })
            .populate("vehicleId", "name image")
            .sort({ createdAt: -1 });

        
        if(!bookings.length){
            return res.status(404).json({ error: "No bookings found" });
        }
        res.json({bookings});
    } catch (err) {
        console.error("Error fetching user bookings", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;