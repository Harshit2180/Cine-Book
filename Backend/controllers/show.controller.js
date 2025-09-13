import axios from "axios"
import { Movie } from "../models/movie.model.js"
import { Show } from "../models/show.model.js"

export const getNowPlayingMovies = async (req, res) => {
    try {

        // add api end point
        await axios.get("api-end-point", {
            headers: {
                Authorization: `Bearer ${process.env.MOVIE_API_KEY}`
            }
        })

        const movies = data.results
        res.json({
            success: true,
            movies: movies
        })

    } catch (error) {
        console.error(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}


export const addShow = async (req, res) => {
    try {

        const { movieId, showsInput, showPrice } = req.body;

        let movie = await Movie.findById(movieId)

        if (!movie) {
            // fetch movie details and credits from the api
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                axios.get(`movie-api/${movieId}`, {
                    headers: {
                        Authorization: `Bearer ${process.env.MOVIE_API_KEY}`
                    }
                }),

                axios.get(`cast-api/${movieId}`, {
                    headers: {
                        Authorization: `Bearer ${process.env.MOVIE_API_KEY}`
                    }
                })
            ])

            const movieApiData = movieDetailsResponse.data
            const movieCreditsData = movieCreditsResponse.data

            const movieDetails = {
                _id: movieId,
                title: movieApiData.title,
                overview: movieApiData.overview,
                poster_path: movieApiData.poster_path,
                backdrop_path: movieApiData.backdrop_path,
                genres: movieApiData.genres,
                casts: movieCreditsData.casts,
                release_date: movieApiData.release_date,
                original_language: movieApiData.original_language,
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime
            }

            movie = await Movie.create(movieDetails)
        }

        const showsToCreate = []

        showsInput.forEach(show => {
            const showDate = show.date
            show.time.forEach((time) => {
                const dateTimeString = `${showDate}T${time}`
                showsToCreate.push({
                    movie: movieId,
                    showDateTime: new Date(dateTimeString),
                    showPrice,
                    occupiedSeats: {}
                })
            })
        })

        if (showsToCreate.length > 0) {
            await Show.insertMany(showsToCreate)
        }

        res.json({
            success: true,
            message: "Show added successfully"
        })

    } catch (error) {
        console.error(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}


export const getShows = async (req, res) => {
    try {

        const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate('movie').sort({ showDateTime: 1 })

        const uniqueShows = new Set(shows.map(show => show.movie))

        res.json({
            success: true,
            shows: Array.from(uniqueShows)
        })

    } catch (error) {
        console.error(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}


export const getShow = async (req, res) => {
    try {

        const { movieId } = req.params

        const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } })

        const movie = await Movie.findById(movieId)
        const dateTime = {}

        shows.forEach((show) => {
            const date = show.showDateTime.toISOString().split("T")[0]
            if (!dateTime[date]) {
                dateTime[date]
            }
            dateTime[date].push({ time: show.showDateTime, showId: show._id })
        })

        res.json({
            success: true,
            movie,
            dateTime
        })

    } catch (error) {
        console.error(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}