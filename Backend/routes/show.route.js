import express from 'express';
import { addShow, getNowPlayingMovies, getShow, getShows } from '../controllers/show.controller.js';

const router = express.Router();

router.route('/now-playing').get(getNowPlayingMovies)    // protectAdmin
router.route('/add').post(addShow)                       // protectAdmin
router.route('/all').get(getShows)
router.route('/:movieId').get(getShow)


export default router