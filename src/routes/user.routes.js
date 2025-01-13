import express from 'express'
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile } from '../controllers/user.controller.js'
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
router.post('/update-user', verifyJWT, updateAccountDetails)

router.post('/update-avatar', verifyJWT, 
    upload.single('avatar'),
    updateUserAvatar)

router.post('/update-cover', verifyJWT,
    upload.single('coverImage'),
    updateUserCoverImage
)

router.get('/get-channel/:username', verifyJWT, getUserChannelProfile)

export default router