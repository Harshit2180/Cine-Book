import express from 'express';
import { getAllBookings, getAllShows, getDashboardData, isAdmin } from '../controllers/admin.controller.js';


const router = express.Router();

router.route('/is-admin').get(isAdmin)             // protectAdmin 
router.route('/dashboar').get(getDashboardData)    // protectAdmin
router.route('/all-shows').get(getAllShows)        // protectAdmin
router.route('/all-bookings').get(getAllBookings)  // protectAdmin

export default router