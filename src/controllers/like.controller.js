import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {type} = req.query
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "video id is missing or invalid!")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(402, "Video not found!")
    }
    const userId = req.user?._id

    const query = {
        [type]: videoId,
        likedBy: userId,
    };
    const existedLike = await Like.findOne(query)
    if(existedLike) {
        await existedLike.deleteOne()
        return res.status(200).json(
            new ApiResponse(200, {}, "Like removed successfully!")
        )
    } else {
        const newLike = new Like({video: video.title,
            likedBy: userId})
        await newLike.save({validateBeforeSave: false})
        return res.status(200).json(
            new ApiResponse(200, {}, "Like added successfully!")
        )
    }

    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
//     if(!isValidObjectId(commentId)) {
//         throw new ApiError(400, "Comment id is missing or Invalid!")
//     }

//     const comment = await Comment.findById(commentId)
//     if(!comment) {
//         throw new ApiError(402, "Comment not found!")
//     }

//     const existedLike = await

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}