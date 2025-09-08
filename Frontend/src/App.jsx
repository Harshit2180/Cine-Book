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
import AdminLayout from './layout/AdminLayout'
import AddShows from './pages/Admin/AddShows'
import ListShows from './pages/Admin/ListShows'
import ListBookings from './pages/Admin/ListBookings'
import Dashboard from './pages/Admin/Dashboard'

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "movies", element: <Movies /> },
      { path: "movies/:id", element: <MovieDetails /> },
      { path: "movies/:id/:date", element: <SeatLayout /> },
      { path: "my-bookings", element: <MyBookings /> },
      { path: "favourites", element: <Favourite /> }
    ]
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "add-shows", element: <AddShows /> },
      { path: "list-shows", element: <ListShows /> },
      { path: "list-bookings", element: <ListBookings /> }
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
