import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const options = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Error while generating tokens")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from front end
    const {fullName, email, username, password} = req.body

    // validate - check if empty
    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fileds are required!")
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format! Please use a valid email.");
    }
    
    // check user already existed
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser) {
        throw new ApiError(409, "User already existed")
    }

    // check for images
    
    
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required!")
    }
    
    //upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    // check for avatar- is it uploaded
    if(!avatar) {
        throw new ApiError(400, "Avatar is required")
    }
    
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // check user is created or not
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user!!!")
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User is registered successfully!")
    )
} )

const loginUser = asyncHandler(async (req, res)=> {
    const {username, email, password} = req.body

    if(!(username || email)) {
        throw new ApiError(400, "Username or email is required")
    }

    if(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format! Please use a valid email.");
    }
    }


    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if(!user) {
        throw new ApiError(400, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid) {
        throw new ApiError(402, "Invalid credentials")
    }
    
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password")

    return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
        new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged In successfully!")
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {refreshToken: ""},
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully!")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request!")
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if(!user) {
        throw new ApiError(401, "Invalid refresh token!")
    }

    if(incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used!")
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', newRefreshToken, options)
    .json(
        new ApiResponse(200, {accessToken, newRefreshToken}, "Access token refreshed")
    )
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "invalid old password")
    }

    if(newPassword !== confirmPassword) {
        throw new ApiError(401, "You are adding wrong passwords!")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed successfully!")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User fetched successfully!")
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body
    if(!fullName || !email) {
        throw new ApiError(401, "email and fullName are required")
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format! Please use a valid email.");
    }

    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            fullName,
            email
        }
    }, {new: true}).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details updated successfully!")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
     if(!avatarLocalPath) {
        throw new ApiError(401, "Avatar is notuploaded locally")
     }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    
    if(!avatar) {
        throw new ApiError(500, "Avatar is not uploaded on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user._id, 
        {
            $set: {avatar: avatar.url}
        },
        {new: true}).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully!")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImagerLocalPath = req.file?.path
     if(!coverImagerLocalPath) {
        throw new ApiError(401, "Cover image is not uploaded locally")
     }

    const coverImage = await uploadOnCloudinary(coverImagerLocalPath)
    
    if(!coverImage) {
        throw new ApiError(500, "coverImage is not uploaded on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user._id, 
        {
            $set: {coverImage: coverImage.url}
        },
        {new: true}).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "coverImage updated successfully!")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params
    if(!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: 'Subscription',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers'
            }
        },
        {
            $lookup: {
                from: 'Subscription',
                localField: '_id',
                foreignField: 'subscriber',
                as: 'subscriberedTo'
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: '$subscribers'
                },
                channelsSubscriberedToCount: {
                    $size: '$subscriberedTo'
                },
                isSubscribered: {
                    $cond: {
                        if: {$in: [req.user?._id, '$subscribers.subscriber']},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscriberedToCount: 1,
                isSubscribered: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])
    
    if(!channel?.length) {
        throw new ApiError(404, "Channel does not exist!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully!")
    )
    
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: 'Videos',
                localField: 'watchHistory',
                foreignField: '_id',
                as: 'watchHistory',
                pipeline: [
                    {
                        $lookup: {
                            from: 'User',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'owner',
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: '$owner'
                            }
                        }
                    }
                ]
            }
        }
    ])
    console.log(user[0].watchHistory);
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully!")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}