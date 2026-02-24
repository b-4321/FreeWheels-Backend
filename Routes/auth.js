const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// router.post('/send-otp', async (req, res) => {
//     const { phone } = req.body;

//     if(!phone) return res.status(400).json({ message: "Phone number is required" });

//     try{
//         // const response = await axios.get('https://2factor.in/API/V1/' + process.env.TWOFACTOR_API_KEY + '/SMS/' + phone + '/AUTOGEN');
//         const response = await axios.get(
//       `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN`,
//     );
//     console.log(response.data)
//         res.json({ success: true, message: "OTP sent successfully", response });

//         if(response.data.Status !== "Success"){
//             return res.status(500).json({error: "Failed to send OTP"});
//         }
//         res.json({sessionId: response.data.Details});
//     } catch (error) {
//         res.status(500).json({ error: 'server error' });
//     }
// })

router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN`,
    );
    console.log(response.data)

    if (response.data.Status !== 'Success') {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    // ✅ Send ONLY ONE response
    return res.status(200).json({
      sessionId: response.data.Details,
    });
  } catch (error) {
    console.log('SEND OTP ERROR:', error);
    return res.status(500).json({ error: 'server error' });
  }
});




router.post('/verify-otp', async (req, res) => {
    const { sessionId, otp, phone } = req.body;

    if(!sessionId || !otp || !phone) return res.status(400).json({ message: "Session ID, OTP and phone number are required" });

    try {
        // const response = await axios.get('https://2factor.in/API/V1/' + process.env.TWOFACTOR_API_KEY + '/SMS/VERIFY/' + sessionId + '/' + otp);
        const response = await axios.get(
          `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`,
        );

        console.log('2FA VERIFY RESPONSE:', response.data);


        if(response.data.Status !== "Success"){
            return res.status(400).json({ error: "Invalid OTP" });
        }

      // let user = await User.findOne({ phone });
      // if (!user) {
      //   user = new User({ phone });
      //   await user.save();
      // }
      // const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      // res.json({ token, user: { phone: user.phone, firstName: user.firstName, email: user.email } });
      let user = await User.findOne({ phone });

      let isNewUser = false;

      if (!user) {
        // Create minimal user
        user = await User.create({ phone });
        isNewUser = true;
      }

      // Create JWT
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        token,
        isNewUser,
        user: {
          phone: user.phone,
          firstName: user.firstName || null,
          email: user.email || null,
        },
      });

  


    }
    // catch(error){
    //     res.status(500).json({ error: 'server error' });
    // }

  catch (error) {
    console.log("🔥 VERIFY OTP CRASH:", error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }


})





router.get('/verify-token', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        phone: user.phone,
        firstName: user.firstName,
        email: user?.email
      }
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(403).json({ error: 'Invalid token' });
  }
});


// router.post("/complete-profile", async(req, res) => {
//   const {phone, firstName, lastName, email} = req.body;
//   if(!phone || !firstName || !lastName || !email) {
//       return res.status(400).json({ error: "Missing required parameters", details: { phone, firstName,  email } });
//   }

//   try{
//     const user = await User.findOneAndUpdate(
//       { phone: phone },   
//       { firstName, lastName, email },
//       { new: true }
//     );


//     res.json({success: true, message: "Profile updated successfully", user});
//   }catch(err){
//       console.error("Error updating profile",err);
//       res.status(500).json({error:"server error"});
//   }
//   })

router.post("/complete-profile", async (req, res) => {
  const { phone, firstName, lastName, email } = req.body;

  if (!phone || !firstName || !email) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { phone },
      { firstName, lastName, email },
      { new: true }
    );

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({ error: "server error" });
  }
});





module.exports = router;