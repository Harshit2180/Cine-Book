import { Inngest } from "inngest";
import { User } from "../models/user.model.js";
import { Booking } from "../models/booking.model.js";
import { Show } from "../models/show.model.js";
import sendEmail from "../config/nodemailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_addresses,
            name: first_name + ' ' + last_name,
            image: image_url
        }
        await User.create(userData)
    }
)

// Inngest Funcion to delete a user from database
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk' },
    { event: 'clerk/user.deletd' },
    async ({ event }) => {
        const { id } = event.data
        await User.findByIdAndDelete(id)
    }
)

// Inngest Function to update user in a database
const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-with-clerk' },
    { event: 'clerk/user.update' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_addresses,
            name: first_name + ' ' + last_name,
            image: image_url
        }
        await User.findByIdAndUpdate(id, userData)
    }
)

const releaseSeatsAndDeleteBooking = inngest.createFunction(
    { id: 'release-seats-delete-booking' },
    { event: "app/checkpayment" },
    async ({ event, step }) => {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000)
        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater)

        await step.run('check-payment-status', async () => {
            const bookingId = event.data.bookingId
            const booking = await Booking.findById(bookingId)

            if (!booking.isPaid) {
                const show = await Show.findById(booking.show)
                booking.bookedSeats.forEach((seat) => {
                    delete show.occupiedSeats[seat]
                })
                show.markModified('occupiedSeats')
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }
        })
    }
)

const sendBookingConfirmationEmail = inngest.createFunction(
    { id: "send-booking-confirmation-email" },
    { event: "app/show.booked" },
    async ({ event, step }) => {
        const { bookingId } = event.data

        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: { path: "movie", model: "Movie" }
        }).populate('user')

        await sendEmail({
            to: booking.user.email,
            subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
            body: `<div style="padding:24px;">
      <p style="font-size:15px;margin:0 0 12px;">Hi <strong>${booking.user.name}</strong>,</p>

      <p style="font-size:15px;margin:0 0 20px;">
        Your movie booking has been confirmed! Here are your details:
      </p>
      
      <div style="background:#f9fbff;border:1px solid #e3e9f2;border-radius:8px;
                  padding:16px;margin-bottom:20px;">
        <p style="margin:6px 0;font-size:14px;"><strong>Movie Title:</strong>${booking.show.movie.title}</p>
        <p style="margin:6px 0;font-size:14px;"><strong>Date:</strong>${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
        <p style="margin:6px 0;font-size:14px;"><strong>Time:</strong>${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
      </div>

      <p style="font-size:14px;margin:0 0 20px;">
        We look forward to seeing you at the show! 🎬
      </p>
      </div>`
        })
    }
)

const sendShowReminders = inngest.createFunction(
    { id: "send-show-reminders" },
    { cron: "0 */8 * * *" },
    async ({ step }) => {
        const now = new Date()
        const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000)
        const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000)

        const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
            const shows = await Show.find({
                showTime: { $gte: windowStart, $lte: in8Hours },
            }).populate('')

            const tasks = []

            for (const show of shows) {
                if (!show.movie || !show.occupiedSeats) continue;

                const userIds = [...new Set(Object.values(show.occupiedSeats))]
                if (userIds.length === 0) continue

                const users = await User.find({ _id: { $in: userIds } }).select("name email")

                for (const user of users) {
                    tasks.push({
                        userEmail: user.email,
                        userName: user.name,
                        movieTitle: show.movie.title,
                        showTime: show.showTime
                    })
                }
            }
            return tasks
        })

        if (reminderTasks.length === 0) {
            return { sent: 0, message: "No reminders to send." }
        }

        const results = await step.run('send-all-reminders', async () => {
            return await Promise.allSettled(reminderTasks.map(task => sendEmail({
                to: task.userEmail,
                subject: `Reminder: Your movie "${task.movieTitle}" starts soon!`,
                body: `<div style="padding:24px;">
  <p style="font-size:15px;margin:0 0 12px;">Hi <strong>${booking.user.name}</strong>,</p>

  <p style="font-size:15px;margin:0 0 20px;">
    This is a friendly reminder for your upcoming movie booking! 🎥  
    Here are your show details:
  </p>
  
  <div style="background:#f9fbff;border:1px solid #e3e9f2;border-radius:8px;
              padding:16px;margin-bottom:20px;">
    <p style="margin:6px 0;font-size:14px;"><strong>Movie Title:</strong> ${booking.show.movie.title}</p>
    <p style="margin:6px 0;font-size:14px;"><strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
    <p style="margin:6px 0;font-size:14px;"><strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
  </div>

  <p style="font-size:14px;margin:0 0 16px;">
    Please arrive at the theater at least <strong>15 minutes early</strong> to ensure a smooth check-in.
  </p>

  <p style="font-size:14px;margin:0 0 20px;">
    We can’t wait for you to enjoy <strong>${booking.show.movie.title}</strong> on the big screen! 🍿
  </p>
</div>`
            })))
        })

        const sent = results.filter(r => r.status === "fulfilled").length
        const failed = results.length - sent

        return {
            sent,
            failed,
            message: `Sent ${sent} reminder(s), ${failed} failed.`
        }
    }
)

const sendNewShowNotification = inngest.createFunction(
    { id: "send-new-show-notifications" },
    { event: "app/show.added" },
    async ({ event }) => {
        const { movieTitle, movieId } = event.data

        const users = await User.find({})

        for (const user of users) {
            userEmail = user.email;
            userName = user.name;

            const subject = `New Show Added: ${movieTitle}`;
            const body = `<div style="padding:24px;">
    <p style="font-size:15px; margin:0 0 12px;">Hi <strong>${user.name}</strong>,</p>

    <p style="font-size:15px; margin:0 0 20px;">
      We’re excited to announce a new show that has just been added to our schedule!
    </p>

      <p style="font-size:14px; margin:0 0 20px;">
      Don’t miss out! Book your tickets now to secure your spot. 🎬
    </p>
    </div>`;

            await sendEmail({
                to: userEmail,
                subject,
                body
            })
        }

        return { message: "Notification sent." }
    }
)


export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, releaseSeatsAndDeleteBooking, sendBookingConfirmationEmail, sendShowReminders, sendNewShowNotification]


