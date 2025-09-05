import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Favourite from './pages/Favourite'
import MainLayout from './layout/MainLayout'
import NotFound from './pages/NotFound'

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/movies", element: <Movies /> },
      { path: "/movies/:id", element: <MovieDetails /> },
      { path: "/movies/:id/:date", element: <SeatLayout /> },
      { path: "/my-bookings", element: <MyBookings /> },
      { path: "/favourites", element: <Favourite /> }
    ]
  },
  {
    path: "*",
    element: <NotFound />
  }
])

const App = () => {
  return (
    <div>
      <RouterProvider router={appRouter} />
    </div>
  )
}

export default App
