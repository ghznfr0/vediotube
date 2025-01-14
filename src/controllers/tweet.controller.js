import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const owner = req.user?._id

    if(!owner) {
        throw new ApiError(404, "User must be logged In to tweet!")
    }

    if(!content) {
        throw new ApiError(404, "content is required!")
    }

    const tweet = await Tweet.create({
        content,
        owner
    })

    return res.status(201).json(
        new ApiResponse(201, tweet, "Tweet created successfully!")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params
    

    if(!mongoose.isValidObjectId(userId)) {
        throw new ApiError(402, "User Id is missing or invalid!")
    }

    const tweets = await Tweet.find({owner: userId}).populate('owner', 'username').sort({createdAt: -1})

    if(tweets.length === 0) {
        throw new ApiError(502, "No tweet associated with this user!")
    }

    return res.status(200).json(
        new ApiResponse(200, tweets, "All tweets fetched!")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body

    if(!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(402, "Tweet Id is missing or invalid!")
    }
    if(!content) {
        throw new ApiError(402, "Content is required!")
    }

    const tweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set: {content: content}
        }, {new: true}
    )

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet updated!")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)) {
        throw new ApiError(402, "Tweet Id is missing or invalid!")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted!")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
