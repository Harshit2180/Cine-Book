import express from 'express';
import { addShow, getNowPlayingMovies, getShow, getShows } from '../controllers/show.controller.js';

const router = express.Router();

router.route('/now-playing').get(getNowPlayingMovies)
router.route('/add').post(addShow)
router.route('/all').get(getShows)
router.route('/:movieId').get(getShow)


export default router