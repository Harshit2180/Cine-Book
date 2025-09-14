import express from 'express';
import { getFavourites, getUserBookings, updateFavourite } from '../controllers/user.controller.js';


const router = express.Router();

router.route('/bookings').get(getUserBookings)
router.route('/update-favourites').post(updateFavourite)
router.route('/favourites').get(getFavourites)

export default router