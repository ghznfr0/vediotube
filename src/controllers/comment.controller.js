import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "VideoId missing or invalid!")
    }

    // const video = await Video.findById(videoId)
    const comments = await Comment.find({video: videoId}).populate('owner', 'username').sort({createdAt: -1})

    return res.status(200).json(
        new ApiResponse(200, comments, "Comments retrieved successfully!")
    );

})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    if(!videoId) {
        throw new ApiError(402, "Video is not found to comment!")
    }
    if(!content) {
        throw new ApiError(400, "Content is required!")
    }
    const owner = req.user?._id
    if(!owner) {
        throw new ApiError(404, "User must be login to comment a video!")
    }

    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found!");
    }

    const comment = await Comment.create({
        content,
        owner,
        video: videoId
    })

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment submitted on a video!")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body

    if(!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(401, "Commentid is missing or invalid!")
    }

    if(!content) {
        throw new ApiError(401, "Please write anything to publish!")
    }

    const comment = await Comment.findByIdAndUpdate(commentId, 
        {
            $set: {content: content}
        }, {new: true}
    )

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment updated successfully!")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const commentId = req.params.id
    
    if(!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(401, "Commentid is missing or invalid!")
    }

    await Comment.findByIdAndDelete(commentId)

    return res.status(201).json(
        new ApiResponse(201, {}, "Comment deleted successfully!")
    )

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
