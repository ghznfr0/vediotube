import express from 'express'
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from '../controllers/user.controller.js'
import {upload} from '../middlewares/multer.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'


const router = express.Router()

router.post('/register',
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]), 
    registerUser)

router.post('/login', loginUser)

// secured routes
router.post('/logout', verifyJWT, logoutUser)
router.post('/refresh-token', refreshAccessToken)
router.post('/change-password', verifyJWT, changeCurrentPassword)
router.get('/get-user', verifyJWT, getCurrentUser)
router.patch('/update-user', verifyJWT, updateAccountDetails)

router.patch('/update-avatar', verifyJWT, 
    upload.single('avatar'),
    updateUserAvatar)

router.patch('/update-cover', verifyJWT,
    upload.single('coverImage'),
    updateUserCoverImage
)

router.get('/get-channel/c/:username', verifyJWT, getUserChannelProfile)

router.get('/get-history', verifyJWT, getWatchHistory)

export default router